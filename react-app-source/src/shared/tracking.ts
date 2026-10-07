import { matchesUrl } from './blocking'
import type { LimitedSite } from './usage'

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
