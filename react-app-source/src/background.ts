// Service worker: keeps the blocking rules in step with the block list.
import { activeSites, blockedPagePath, buildRules, findMatch } from './shared/blocking'
import type { ActiveSite } from './shared/blocking'
import { isPaused, loadLocal, setPause } from './shared/local'
import { RESET_ALARM, completeResetIfDue, rearmResetAlarm } from './shared/lockActions'
import { loadState } from './shared/storage'

const PAUSE_ALARM = 'blockr-pause-end'

async function currentSites(): Promise<ActiveSite[]> {
  const [state, local] = await Promise.all([loadState(), loadLocal()])
  return isPaused(local.pause) ? [] : activeSites(state)
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

  await sweepOpenTabs(sites)
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
})

// Redirect rules only see full page loads. Sites like YouTube change page
// without one (pushState), so catch those here.
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId !== 0) return
  const match = findMatch(await currentSites(), details.url)
  if (match) chrome.tabs.update(details.tabId, { url: blockedTabUrl(match) })
})
