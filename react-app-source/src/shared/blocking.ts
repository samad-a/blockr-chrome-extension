import { ALL_PRESETS } from './presets'
import type { BlockListState } from './types'
import { EMPTY_USAGE, dayKey, secondsUsed } from './usage'
import type { LimitedSite, Usage } from './usage'

export type ActiveSite = { name: string; url: string; /** Set when blocked because a daily limit ran out. */ limitMinutes?: number }

/** Presets are on unless the user has switched them off. */
export const isPresetEnabled = (state: BlockListState, id: string) => state.presetEnabled[id] ?? true

/** Enabled custom sites that have a daily limit. */
export function limitedSites(state: BlockListState): LimitedSite[] {
  return state.customSites
    .filter((site) => site.enabled && site.dailyLimit)
    .map((site) => ({ name: site.name, url: site.url, limitMinutes: site.dailyLimit! }))
}

/**
 * Sites that should be blocked right now, one per distinct URL.
 * A site with a daily limit is allowed until its time for today is used up.
 */
export function activeSites(
  state: BlockListState,
  usage: Usage = EMPTY_USAGE,
  today: string = dayKey(),
): ActiveSite[] {
  const byUrl = new Map<string, ActiveSite>()
  const allowedByLimit = new Set<string>()
  for (const site of state.customSites) {
    if (!site.enabled) continue
    if (site.dailyLimit && secondsUsed(usage, site.url, today) < site.dailyLimit * 60) {
      allowedByLimit.add(site.url)
      continue
    }
    byUrl.set(site.url, { name: site.name, url: site.url, limitMinutes: site.dailyLimit })
  }
  for (const preset of ALL_PRESETS) {
    if (
      state.categories[preset.category] &&
      isPresetEnabled(state, preset.id) &&
      !byUrl.has(preset.url) &&
      !allowedByLimit.has(preset.url) // a custom limit on the same site overrides the preset
    ) {
      byUrl.set(preset.url, { name: preset.name, url: preset.url })
    }
  }
  return [...byUrl.values()]
}

export const countBlocked = (state: BlockListState, usage: Usage = EMPTY_USAGE, today: string = dayKey()) =>
  activeSites(state, usage, today).length

/**
 * Does `pageUrl` fall under a block entry like "tiktok.com" or "youtube.com/shorts"?
 * Subdomains match ("www.tiktok.com"); paths match on whole segments only.
 */
export function matchesUrl(blockUrl: string, pageUrl: string): boolean {
  let page: URL
  try {
    page = new URL(pageUrl)
  } catch {
    return false
  }
  if (page.protocol !== 'http:' && page.protocol !== 'https:') return false

  const [host, ...pathParts] = blockUrl.split('/')
  const pageHost = page.hostname.toLowerCase()
  if (pageHost !== host && !pageHost.endsWith(`.${host}`)) return false

  if (pathParts.length === 0) return true
  const path = `/${pathParts.join('/')}`
  const pagePath = page.pathname.toLowerCase()
  return pagePath === path || pagePath.startsWith(`${path}/`)
}

export function findMatch(sites: ActiveSite[], pageUrl: string): ActiveSite | undefined {
  return sites.find((site) => matchesUrl(site.url, pageUrl))
}

/** Extension-relative path of the page shown instead of a blocked site. */
export function blockedPagePath(site: ActiveSite): string {
  const limit = site.limitMinutes ? `&limit=${site.limitMinutes}` : ''
  return `/blocked.html?site=${encodeURIComponent(site.name)}&url=${encodeURIComponent(site.url)}${limit}`
}

/** declarativeNetRequest rules that redirect top-level loads of each site to the blocked page. */
export function buildRules(sites: ActiveSite[]): chrome.declarativeNetRequest.Rule[] {
  return sites.map((site, i) => ({
    id: i + 1,
    priority: 1,
    action: {
      type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
      redirect: { extensionPath: blockedPagePath(site) },
    },
    condition: {
      // "||" anchors at a domain boundary (so subdomains match); "^" ends at a
      // separator, so "youtube.com/shorts" doesn't match "youtube.com/shortsfoo".
      urlFilter: `||${site.url}^`,
      resourceTypes: ['main_frame' as chrome.declarativeNetRequest.ResourceType],
    },
  }))
}
