import { describe, expect, it } from 'vitest'
import { activeSites, blockedPagePath, buildRules, countBlocked, findMatch, limitedSites, matchesUrl } from './blocking'
import { DEFAULT_STATE } from './storage'
import type { BlockListState } from './types'
import { addUsage, EMPTY_USAGE } from './usage'

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
      presetEnabled: {
        'social-instagram': false,
        'social-x': false,
        'social-facebook': false,
        'social-snapchat': false,
        'social-threads': false,
      },
      categories: { social: true, shortForm: false },
    }
    expect(activeSites(state).map((s) => s.url)).toEqual(['tiktok.com', 'reddit.com', 'redd.it'])
  })

  it('is empty by default', () => {
    expect(activeSites(DEFAULT_STATE)).toEqual([])
  })
})

describe('findMatch', () => {
  it('returns the matching site', () => {
    const sites = [{ name: 'Reddit', url: 'reddit.com', key: 'preset:social-reddit' }]
    expect(findMatch(sites, 'https://old.reddit.com/r/x')).toEqual(sites[0])
    expect(findMatch(sites, 'https://example.com')).toBeUndefined()
  })
})

describe('buildRules', () => {
  it('creates one main_frame redirect rule per site with unique ids', () => {
    const rules = buildRules([
      { name: 'TikTok', url: 'tiktok.com', key: 'a' },
      { name: 'Shorts', url: 'youtube.com/shorts', key: 'b' },
    ])
    expect(rules.map((r) => r.id)).toEqual([1, 2])
    expect(rules[1].condition.urlFilter).toBe('||youtube.com/shorts^')
    expect(rules[1].condition.resourceTypes).toEqual(['main_frame'])
    expect(rules[0].action.redirect?.extensionPath).toBe(
      blockedPagePath({ name: 'TikTok', url: 'tiktok.com', key: 'a' }),
    )
  })

  it('encodes names in the blocked page path', () => {
    expect(blockedPagePath({ name: 'A & B', url: 'a.com', key: 'a' })).toBe('/blocked.html?site=A%20%26%20B&url=a.com')
  })
})

describe('daily limits', () => {
  const TODAY = '2026-10-12'
  const limited = (url: string, dailyLimit: number, enabled = true) => ({ ...site(url, enabled), dailyLimit })
  const state: BlockListState = {
    ...DEFAULT_STATE,
    customSites: [limited('youtube.com', 20), site('x.com', true)],
  }

  it('does not block a limited site until its time is used up', () => {
    const urls = activeSites(state, EMPTY_USAGE, TODAY).map((s) => s.url)
    expect(urls).toEqual(['x.com'])
    expect(countBlocked(state, EMPTY_USAGE, TODAY)).toBe(1)
  })

  it('blocks it once the limit is reached, and tells the blocked page about the limit', () => {
    const usage = addUsage(EMPTY_USAGE, ['youtube.com'], 20 * 60, TODAY)
    const sites = activeSites(state, usage, TODAY)
    expect(sites.map((s) => s.url)).toEqual(['youtube.com', 'x.com'])
    expect(sites[0].limitMinutes).toBe(20)
    expect(blockedPagePath(sites[0])).toContain('&limit=20')
    expect(blockedPagePath(sites[1])).not.toContain('limit')
  })

  it('unblocks again the next day', () => {
    const usage = addUsage(EMPTY_USAGE, ['youtube.com'], 99999, '2026-10-11')
    expect(activeSites(state, usage, TODAY).map((s) => s.url)).toEqual(['x.com'])
  })

  it('ignores limits on disabled sites', () => {
    const off: BlockListState = { ...DEFAULT_STATE, customSites: [limited('youtube.com', 20, false)] }
    expect(limitedSites(off)).toEqual([])
    expect(activeSites(off, EMPTY_USAGE, TODAY)).toEqual([])
  })

  it('lists enabled limited sites', () => {
    expect(limitedSites(state)).toEqual([{ name: 'youtube.com', url: 'youtube.com', limitMinutes: 20 }])
  })

  it('lets a custom limit override a preset on the same site', () => {
    const withPreset: BlockListState = {
      customSites: [limited('tiktok.com', 15)],
      presetEnabled: {},
      categories: { social: true, shortForm: false },
    }
    const urls = activeSites(withPreset, EMPTY_USAGE, TODAY).map((s) => s.url)
    expect(urls).not.toContain('tiktok.com')
    expect(urls).toContain('reddit.com')
    const used = addUsage(EMPTY_USAGE, ['tiktok.com'], 15 * 60, TODAY)
    expect(activeSites(withPreset, used, TODAY).map((s) => s.url)).toContain('tiktok.com')
  })
})

describe('presets with several addresses', () => {
  const social: BlockListState = { ...DEFAULT_STATE, categories: { social: true, shortForm: false } }

  it('blocks every address of a preset but counts it as one site', () => {
    const only = (id: string): BlockListState => ({
      ...social,
      presetEnabled: Object.fromEntries(
        ['instagram', 'tiktok', 'x', 'facebook', 'reddit', 'snapchat', 'threads'].filter((n) => n !== id).map((n) => [`social-${n}`, false]),
      ),
    })
    const x = only('x')
    expect(activeSites(x).map((s) => s.url)).toEqual(['x.com', 'twitter.com'])
    expect(countBlocked(x)).toBe(1)
    expect(activeSites(only('reddit')).map((s) => s.url)).toEqual(['reddit.com', 'redd.it'])
    expect(activeSites(only('threads')).map((s) => s.url)).toEqual(['threads.net', 'threads.com'])
  })

  it('matches pages on either address', () => {
    const sites = activeSites(social)
    expect(findMatch(sites, 'https://twitter.com/home')?.name).toBe('X')
    expect(findMatch(sites, 'https://redd.it/abc')?.name).toBe('Reddit')
    expect(findMatch(sites, 'https://www.fb.com/')?.name).toBe('Facebook')
  })

  it('covers both address forms of a reel, but not the rest of the site', () => {
    const shortForm: BlockListState = { ...DEFAULT_STATE, categories: { social: false, shortForm: true } }
    const sites = activeSites(shortForm)
    expect(findMatch(sites, 'https://www.instagram.com/reels/')?.name).toBe('Instagram Reels')
    expect(findMatch(sites, 'https://www.instagram.com/reel/Cabc123/')?.name).toBe('Instagram Reels')
    expect(findMatch(sites, 'https://www.facebook.com/reel/123')?.name).toBe('Facebook Reels')
    expect(findMatch(sites, 'https://www.snapchat.com/spotlight/x')?.name).toBe('Snapchat Spotlight')
    expect(findMatch(sites, 'https://www.instagram.com/someone/')).toBeUndefined()
    expect(findMatch(sites, 'https://www.facebook.com/someone')).toBeUndefined()
  })
})
