// Service worker: keeps the blocking rules in step with the block list,
// and tracks time on sites that have a daily limit.
import { activeSites, blockedPagePath, buildRules, findMatch, limitedSites } from './shared/blocking'
import type { ActiveSite } from './shared/blocking'
import { isPaused, loadLocal, setPause } from './shared/local'
import { RESET_ALARM, completeResetIfDue, rearmResetAlarm } from './shared/lockActions'
import { isBlockingNow, loadSchedule, nextChange } from './shared/schedule'
import { ensureMigrated } from './shared/migrations'
import { loadState } from './shared/storage'
import { IDLE_SECONDS, bankElapsed, trackedSiteUrls } from './shared/tracking'
import type { TrackerState } from './shared/tracking'
import { dayKey, exhaustedUrls } from './shared/usage'

const PAUSE_ALARM = 'blockr-pause-end'
const SCHEDULE_ALARM = 'blockr-schedule-change'
/** Heartbeat while a limited site exists: banks time during long unbroken stretches. */
const USAGE_ALARM = 'blockr-usage-tick'
const TRACKER_KEY = 'trackerState'

async function currentSites(): Promise<ActiveSite[]> {
  const [state, local, schedule] = await Promise.all([loadState(), loadLocal(), loadSchedule()])
  // Nothing is blocked while paused, or outside the block schedule's hours.
  return isPaused(local.pause) || !isBlockingNow(schedule) ? [] : activeSites(state, local.usage)
}

const blockedTabUrl = (site: ActiveSite) => chrome.runtime.getURL(blockedPagePath(site))

/** Sends any already-open tab on a blocked site to the blocked page. */
async function sweepOpenTabs(sites: ActiveSite[]) {
  if (sites.length === 0) return
  const tabs = await chrome.tabs.query({})
  await Promise.all(
    tabs.map((tab) => {
      const match = tab.id !== undefined && tab.url ? findMatch(sites, tab.url) : undefined
      return match ? chrome.tabs.update(tab.id!, { url: blockedTabUrl(match) }) : undefined
    }),
  )
}

/** Is there a daily limit to enforce, and is blocking on right now? Time only counts when both are true. */
async function trackingNeeded() {
  const [state, local, schedule] = await Promise.all([loadState(), loadLocal(), loadSchedule()])
  const limited = limitedSites(state)
  return { active: limited.length > 0 && !isPaused(local.pause) && isBlockingNow(schedule), limited, local }
}

async function applyRules() {
  const sites = await currentSites()
  const existing = await chrome.declarativeNetRequest.getDynamicRules()
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: buildRules(sites),
  })

  // Resume automatically when a timed pause ends.
  const { pause } = await loadLocal()
  if (pause?.until && pause.until > Date.now()) {
    await chrome.alarms.create(PAUSE_ALARM, { when: pause.until })
  } else {
    await chrome.alarms.clear(PAUSE_ALARM)
  }

  // Run the usage heartbeat only while there is a limit to enforce.
  const { active: tracking } = await trackingNeeded()
  if (tracking) {
    if (!(await chrome.alarms.get(USAGE_ALARM))) await chrome.alarms.create(USAGE_ALARM, { periodInMinutes: 0.5 })
    requestSample()
  } else {
    await chrome.alarms.clear(USAGE_ALARM)
    await chrome.storage.session.remove(TRACKER_KEY)
  }

  // Re-apply the rules when the schedule next turns blocking on or off.
  const change = nextChange(await loadSchedule())
  if (change) await chrome.alarms.create(SCHEDULE_ALARM, { when: change.getTime() })
  else await chrome.alarms.clear(SCHEDULE_ALARM)

  await sweepOpenTabs(sites)
}

/**
 * Looks at what is in use right now, credits the time since the last look to
 * what was in use then, and remembers the new state. Runs on focus, tab, audio
 * and idle changes (so time is attributed exactly when things change) and on
 * the heartbeat. Re-applies the rules when a limit runs out or a new day starts.
 */
async function sample() {
  const { active, limited, local } = await trackingNeeded()
  if (!active) {
    await chrome.storage.session.remove(TRACKER_KEY)
    return
  }

  const now = Date.now()
  const previous = ((await chrome.storage.session.get({ [TRACKER_KEY]: null }))[TRACKER_KEY] ?? null) as TrackerState | null

  // New day: forget yesterday's time and lift yesterday's limit blocks.
  let usage = local.usage
  const today = dayKey()
  if (usage.date && usage.date !== today) {
    usage = { date: today, seconds: {} }
    await chrome.storage.local.set({ usage })
    refresh()
  }

  const before = exhaustedUrls(limited, usage)
  const banked = bankElapsed(usage, previous, now)
  if (banked !== usage) {
    usage = banked
    await chrome.storage.local.set({ usage })
  }

  const [tabs, win, idle] = await Promise.all([
    chrome.tabs.query({}),
    chrome.windows.getLastFocused().catch(() => null),
    chrome.idle.queryState(IDLE_SECONDS),
  ])
  const urls = trackedSiteUrls(
    tabs.map((tab) => ({ url: tab.url, active: tab.active, windowId: tab.windowId, audible: tab.audible })),
    win?.focused ? (win.id ?? null) : null,
    idle === 'active',
    limited,
  )
  await chrome.storage.session.set({ [TRACKER_KEY]: { since: now, urls } satisfies TrackerState })

  if (before.join() !== exhaustedUrls(limited, usage).join()) refresh()
}

// Run updates one at a time so quick successive changes can't interleave.
let queue: Promise<unknown> = Promise.resolve()
const refresh = () => {
  queue = queue.then(applyRules).catch((e) => console.error('Blockr: failed to update rules', e))
}

// A burst of events (e.g. switching windows) only needs one look afterwards.
let sampleQueued = false
let sampleQueue: Promise<unknown> = Promise.resolve()
function requestSample() {
  if (sampleQueued) return
  sampleQueued = true
  sampleQueue = sampleQueue
    .then(() => {
      sampleQueued = false
      return sample()
    })
    .catch((e) => console.error('Blockr: usage tracking failed', e))
}

// Upgrade stored data first (it is safe to repeat), then apply the rules.
const startUp = () => {
  ensureMigrated()
    .catch((e) => console.error('Blockr: migration failed', e))
    .finally(refresh)
}
chrome.runtime.onInstalled.addListener(startUp)
chrome.runtime.onStartup.addListener(() => {
  startUp()
  rearmResetAlarm()
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' || (area === 'local' && changes.pause)) refresh()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === PAUSE_ALARM) setPause(null)
  if (alarm.name === RESET_ALARM) completeResetIfDue()
  if (alarm.name === SCHEDULE_ALARM) refresh()
  if (alarm.name === USAGE_ALARM) requestSample()
})

// What counts as "in use" changes when focus, the active tab, sound or idleness changes.
// These events are rare (they follow the user's own actions) and each only does a small read.
chrome.idle.setDetectionInterval(IDLE_SECONDS)
chrome.idle.onStateChanged.addListener(requestSample)
chrome.windows.onFocusChanged.addListener(requestSample)
chrome.tabs.onActivated.addListener(requestSample)
chrome.tabs.onRemoved.addListener(requestSample)
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.audible !== undefined || changeInfo.url !== undefined) requestSample()
})

// Redirect rules only see full page loads. Sites like YouTube change page
// without one (pushState), so catch those here.
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId !== 0) return
  const match = findMatch(await currentSites(), details.url)
  if (match) chrome.tabs.update(details.tabId, { url: blockedTabUrl(match) })
})
