import { matchesUrl } from './blocking'
import { addUsage, dayKey } from './usage'
import type { LimitedSite, Usage } from './usage'

/** After this long without input, Chrome reports the user as idle (2.5 minutes). */
export const IDLE_SECONDS = 150

/** Most time one stretch can be credited, so a sleeping computer doesn't count as use. */
export const MAX_STRETCH_SECONDS = 75

/** What was in use since `since` (epoch ms), remembered between events. */
export type TrackerState = { since: number; urls: string[] }

/** The bits of a chrome.tabs.Tab the tracker needs. */
export type TabInfo = {
  url?: string
  active: boolean
  windowId: number
  /** True while the tab is playing sound (even if it isn't the focused tab). */
  audible?: boolean
}

/**
 * Which limited sites count as "in use" right now.
 *
 * A site is in use if one of its tabs is playing sound, or if it is the active
 * tab of the focused window while the user is active (not idle or screen-locked).
 * Each site is credited once, however many of its tabs are open.
 */
export function trackedSiteUrls(
  tabs: TabInfo[],
  focusedWindowId: number | null,
  userActive: boolean,
  sites: LimitedSite[],
): string[] {
  const inUse = new Set<string>()
  for (const tab of tabs) {
    if (!tab.url) continue
    const watching = userActive && tab.active && tab.windowId === focusedWindowId
    if (!watching && !tab.audible) continue
    for (const site of sites) {
      if (matchesUrl(site.url, tab.url)) inUse.add(site.url)
    }
  }
  return [...inUse]
}

/**
 * Adds the time since the last event to the sites that were in use during it.
 * A stretch is capped, so a missed event (sleep, crash) can't credit hours.
 */
export function bankElapsed(
  usage: Usage,
  state: TrackerState | null,
  now: number,
  today: string = dayKey(),
): Usage {
  if (!state) return usage
  const seconds = Math.min(Math.max(0, (now - state.since) / 1000), MAX_STRETCH_SECONDS)
  return addUsage(usage, state.urls, seconds, today)
}
