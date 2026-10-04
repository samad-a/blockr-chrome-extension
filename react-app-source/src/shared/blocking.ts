import { ALL_PRESETS } from './presets'
import type { BlockListState } from './types'

export type ActiveSite = { name: string; url: string }

/** Presets are on unless the user has switched them off. */
export const isPresetEnabled = (state: BlockListState, id: string) => state.presetEnabled[id] ?? true

/** Sites that should be blocked right now, one per distinct URL. */
export function activeSites(state: BlockListState): ActiveSite[] {
  const byUrl = new Map<string, ActiveSite>()
  for (const site of state.customSites) {
    if (site.enabled) byUrl.set(site.url, { name: site.name, url: site.url })
  }
  for (const preset of ALL_PRESETS) {
    if (state.categories[preset.category] && isPresetEnabled(state, preset.id) && !byUrl.has(preset.url)) {
      byUrl.set(preset.url, { name: preset.name, url: preset.url })
    }
  }
  return [...byUrl.values()]
}

export const countBlocked = (state: BlockListState) => activeSites(state).length

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
  return `/blocked.html?site=${encodeURIComponent(site.name)}&url=${encodeURIComponent(site.url)}`
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
