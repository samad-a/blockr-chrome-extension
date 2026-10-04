import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, countBlocked } from './storage'
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
    const presetEnabled = { 'social-instagram': true, 'social-reddit': true }
    expect(countBlocked({ ...DEFAULT_STATE, presetEnabled })).toBe(0)
    expect(
      countBlocked({ ...DEFAULT_STATE, presetEnabled, categories: { social: true, shortForm: false } }),
    ).toBe(2)
  })

  it('counts a URL once even if it is in several lists', () => {
    const state: BlockListState = {
      customSites: [site('tiktok.com', true)],
      presetEnabled: { 'social-tiktok': true, 'short-tiktok': true },
      categories: { social: true, shortForm: true },
    }
    expect(countBlocked(state)).toBe(1)
  })
})
