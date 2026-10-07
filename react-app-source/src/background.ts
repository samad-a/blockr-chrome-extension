// Service worker: keeps the blocking rules in step with the block list.
import { activeSites, blockedPagePath, buildRules, findMatch, limitedSites } from './shared/blocking'
import type { ActiveSite } from './shared/blocking'
import { isPaused, loadLocal, setPause } from './shared/local'
import { RESET_ALARM, completeResetIfDue, rearmResetAlarm } from './shared/lockActions'
import { isBlockingNow, loadSchedule, nextChange } from './shared/schedule'
import { loadState } from './shared/storage'
import { trackedSiteUrls } from './shared/tracking'
import { addUsage, dayKey, exhaustedUrls } from './shared/usage'

const PAUSE_ALARM = 'blockr-pause-end'
const SCHEDULE_ALARM = 'blockr-schedule-change'
const USAGE_ALARM = 'blockr-usage-tick'
const LAST_TICK_KEY = 'lastUsageTick'
/** Time credited per tick is capped so a sleeping computer doesn't count as use. */
const MAX_TICK_SECONDS = 75

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

  // Time limits are only tracked while blocking is active and a limited site exists.
  const { active: tracking } = await trackingNeeded()
  if (tracking) {
    if (!(await chrome.alarms.get(USAGE_ALARM))) await chrome.alarms.create(USAGE_ALARM, { periodInMinutes: 0.5 })
  } else {
    await chrome.alarms.clear(USAGE_ALARM)
    await chrome.storage.session.remove(LAST_TICK_KEY)
  }

  // Re-apply the rules when the schedule next turns blocking on or off.
  const change = nextChange(await loadSchedule())
  if (change) await chrome.alarms.create(SCHEDULE_ALARM, { when: change.getTime() })
  else await chrome.alarms.clear(SCHEDULE_ALARM)

  await sweepOpenTabs(sites)
}

async function trackingNeeded() {
  const [state, local, schedule] = await Promise.all([loadState(), loadLocal(), loadSchedule()])
  const limited = limitedSites(state)
  return { active: limited.length > 0 && !isPaused(local.pause) && isBlockingNow(schedule), limited, local }
}

/**
 * Called every 30 seconds while a daily-limit site exists. Credits the elapsed
 * time to the limited sites in use (watched in the focused window, or playing
 * sound), and re-applies the rules when a limit runs out or a new day starts.
 */
async function trackUsage() {
  const { active: needed, limited, local } = await trackingNeeded()
  const now = Date.now()
  const last = ((await chrome.storage.session.get({ [LAST_TICK_KEY]: null }))[LAST_TICK_KEY] ?? null) as number | null
  await chrome.storage.session.set({ [LAST_TICK_KEY]: now })
  if (!needed) return

  // New day: forget yesterday's time and lift yesterday's limit blocks.
  const today = dayKey()
  if (local.usage.date && local.usage.date !== today) {
    await chrome.storage.local.set({ usage: { date: today, seconds: {} } })
    refresh()
    return
  }
  if (last === null) return

  const elapsed = Math.min((now - last) / 1000, MAX_TICK_SECONDS)
  const [tabs, win, idle] = await Promise.all([
    chrome.tabs.query({}),
    chrome.windows.getLastFocused().catch(() => null),
    chrome.idle.queryState(60),
  ])
  const urls = trackedSiteUrls(
    tabs.map((tab) => ({ url: tab.url, active: tab.active, windowId: tab.windowId, audible: tab.audible })),
    win?.focused ? (win.id ?? null) : null,
    idle === 'active',
    limited,
  )
  if (urls.length === 0) return

  const before = exhaustedUrls(limited, local.usage)
  const usage = addUsage(local.usage, urls, elapsed)
  await chrome.storage.local.set({ usage })
  if (before.join() !== exhaustedUrls(limited, usage).join()) refresh()
}

// Run updates one at a time so quick successive changes can't interleave.
let queue: Promise<unknown> = Promise.resolve()
const refresh = () => {
  queue = queue.then(applyRules).catch((e) => console.error('Blockr: failed to update rules', e))
}

chrome.runtime.onInstalled.addListener(refresh)
chrome.runtime.onStartup.addListener(() => {
  refresh()
  rearmResetAlarm()
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' || (area === 'local' && changes.pause)) refresh()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === PAUSE_ALARM) setPause(null)
  if (alarm.name === RESET_ALARM) completeResetIfDue()
  if (alarm.name === SCHEDULE_ALARM) refresh()
  if (alarm.name === USAGE_ALARM) trackUsage().catch((e) => console.error('Blockr: usage tracking failed', e))
})

// Redirect rules only see full page loads. Sites like YouTube change page
// without one (pushState), so catch those here.
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId !== 0) return
  const match = findMatch(await currentSites(), details.url)
  if (match) chrome.tabs.update(details.tabId, { url: blockedTabUrl(match) })
})
