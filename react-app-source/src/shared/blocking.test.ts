import { describe, expect, it } from 'vitest'
import { activeSites, blockedPagePath, buildRules, findMatch, matchesUrl } from './blocking'
import { DEFAULT_STATE } from './storage'
import type { BlockListState } from './types'

describe('matchesUrl', () => {
  it('matches the host and its subdomains', () => {
    expect(matchesUrl('tiktok.com', 'https://tiktok.com/')).toBe(true)
    expect(matchesUrl('tiktok.com', 'https://www.tiktok.com/@user/video/1?x=1')).toBe(true)
    expect(matchesUrl('tiktok.com', 'http://m.TikTok.com')).toBe(true)
  })

  it('does not match look-alike hosts', () => {
    expect(matchesUrl('tiktok.com', 'https://nottiktok.com/')).toBe(false)
    expect(matchesUrl('tiktok.com', 'https://tiktok.com.evil.org/')).toBe(false)
    expect(matchesUrl('tiktok.com', 'https://example.com/?u=tiktok.com')).toBe(false)
  })

  it('matches paths on whole segments', () => {
    expect(matchesUrl('youtube.com/shorts', 'https://www.youtube.com/shorts')).toBe(true)
    expect(matchesUrl('youtube.com/shorts', 'https://www.youtube.com/shorts/abc123')).toBe(true)
    expect(matchesUrl('youtube.com/shorts', 'https://www.youtube.com/watch?v=1')).toBe(false)
    expect(matchesUrl('youtube.com/shorts', 'https://www.youtube.com/shortsfoo')).toBe(false)
  })

  it('ignores non-web URLs and garbage', () => {
    expect(matchesUrl('tiktok.com', 'chrome://extensions')).toBe(false)
    expect(matchesUrl('tiktok.com', 'not a url')).toBe(false)
  })
})

const site = (url: string, enabled: boolean) => ({ id: url, name: url, url, dateAdded: 0, enabled })

describe('activeSites', () => {
  it('combines enabled custom sites and presets with their category on, without duplicates', () => {
    const state: BlockListState = {
      customSites: [site('tiktok.com', true), site('off.com', false)],
      presetEnabled: { 'social-instagram': false, 'social-x': false, 'social-facebook': false },
      categories: { social: true, shortForm: false },
    }
    expect(activeSites(state).map((s) => s.url)).toEqual(['tiktok.com', 'reddit.com'])
  })

  it('is empty by default', () => {
    expect(activeSites(DEFAULT_STATE)).toEqual([])
  })
})

describe('findMatch', () => {
  it('returns the matching site', () => {
    const sites = [{ name: 'Reddit', url: 'reddit.com' }]
    expect(findMatch(sites, 'https://old.reddit.com/r/x')).toEqual(sites[0])
    expect(findMatch(sites, 'https://example.com')).toBeUndefined()
  })
})

describe('buildRules', () => {
  it('creates one main_frame redirect rule per site with unique ids', () => {
    const rules = buildRules([
      { name: 'TikTok', url: 'tiktok.com' },
      { name: 'Shorts', url: 'youtube.com/shorts' },
    ])
    expect(rules.map((r) => r.id)).toEqual([1, 2])
    expect(rules[1].condition.urlFilter).toBe('||youtube.com/shorts^')
    expect(rules[1].condition.resourceTypes).toEqual(['main_frame'])
    expect(rules[0].action.redirect?.extensionPath).toBe(
      blockedPagePath({ name: 'TikTok', url: 'tiktok.com' }),
    )
  })

  it('encodes names in the blocked page path', () => {
    expect(blockedPagePath({ name: 'A & B', url: 'a.com' })).toBe('/blocked.html?site=A%20%26%20B&url=a.com')
  })
})
