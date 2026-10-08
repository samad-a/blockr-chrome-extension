import { describe, expect, it } from 'vitest'
import { countBlocked } from './blocking'
import { DEFAULT_STATE } from './storage'
import type { BlockListState } from './types'

const site = (url: string, enabled: boolean) => ({ id: url, name: url, url, dateAdded: 0, enabled })

describe('countBlocked', () => {
  it('is 0 by default', () => {
    expect(countBlocked(DEFAULT_STATE)).toBe(0)
  })

  it('counts only enabled custom sites', () => {
    const state: BlockListState = {
      ...DEFAULT_STATE,
      customSites: [site('a.com', true), site('b.com', false)],
    }
    expect(countBlocked(state)).toBe(1)
  })

  it('counts presets only when their category switch is on', () => {
    const presetEnabled = { 'social-tiktok': false, 'social-x': false, 'social-facebook': false }
    expect(countBlocked({ ...DEFAULT_STATE, presetEnabled })).toBe(0)
    expect(
      countBlocked({ ...DEFAULT_STATE, presetEnabled, categories: { social: true, shortForm: false, adult: false } }),
    ).toBe(4)
  })

  it('treats presets as on unless switched off', () => {
    const categories = { social: true, shortForm: false, adult: false }
    expect(countBlocked({ ...DEFAULT_STATE, categories })).toBe(7)
    expect(countBlocked({ ...DEFAULT_STATE, categories, presetEnabled: { 'social-reddit': false } })).toBe(6)
  })

  it('counts a URL once even if it is in several lists', () => {
    const state: BlockListState = {
      customSites: [site('tiktok.com', true)],
      presetEnabled: {
        'social-instagram': false,
        'social-x': false,
        'social-facebook': false,
        'social-reddit': false,
        'short-youtube-shorts': false,
        'short-instagram-reels': false,
        'social-snapchat': false,
        'social-threads': false,
        'short-facebook-reels': false,
        'short-snapchat-spotlight': false,
      },
      categories: { social: true, shortForm: true, adult: false },
    }
    expect(countBlocked(state)).toBe(1)
  })
})
