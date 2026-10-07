import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, diffState, sanitizeSite, siteKey, stateFromData } from './storageLayout'
import type { BlockListState, CustomSite } from './types'

const site = (id: string, overrides: Partial<CustomSite> = {}): CustomSite => ({
  id,
  name: id,
  url: `${id}.com`,
  dateAdded: 100,
  enabled: true,
  ...overrides,
})

describe('sanitizeSite', () => {
  it('keeps a valid site, including a daily limit', () => {
    expect(sanitizeSite({ id: 'a', name: 'A', url: 'a.com', dateAdded: 5, enabled: false, dailyLimit: 20 })).toEqual({
      id: 'a',
      name: 'A',
      url: 'a.com',
      dateAdded: 5,
      enabled: false,
      dailyLimit: 20,
    })
  })

  it('repairs missing fields and drops bad limits', () => {
    expect(sanitizeSite({ id: 'a', url: 'a.com', dailyLimit: 0 })).toEqual({
      id: 'a',
      name: 'a.com',
      url: 'a.com',
      dateAdded: 0,
      enabled: true,
    })
    expect(sanitizeSite({ id: 'a', url: 'a.com', dailyLimit: 99999 })).not.toHaveProperty('dailyLimit')
    expect(sanitizeSite({ id: 'a', url: 'a.com', dailyLimit: 1.5 })).not.toHaveProperty('dailyLimit')
  })

  it.each([null, 'x', 5, [], {}, { id: '', url: 'a.com' }, { id: 'a' }, { id: 'a', url: '' }])('rejects %j', (value) => {
    expect(sanitizeSite(value)).toBeNull()
  })
})

describe('stateFromData', () => {
  it('reads the defaults from empty data', () => {
    expect(stateFromData({})).toEqual(DEFAULT_STATE)
  })

  it('returns sites in the saved order', () => {
    const data = {
      customOrder: ['b', 'a'],
      [siteKey('a')]: site('a'),
      [siteKey('b')]: site('b'),
    }
    expect(stateFromData(data).customSites.map((s) => s.id)).toEqual(['b', 'a'])
  })

  it('appends sites missing from the order list, oldest first, and skips ids with no entry', () => {
    const data = {
      customOrder: ['a', 'ghost'],
      [siteKey('a')]: site('a'),
      [siteKey('late2')]: site('late2', { dateAdded: 300 }),
      [siteKey('late1')]: site('late1', { dateAdded: 200 }),
    }
    expect(stateFromData(data).customSites.map((s) => s.id)).toEqual(['a', 'late1', 'late2'])
  })

  it('ignores corrupt entries and unknown keys', () => {
    const data = { customOrder: ['a', 5], [siteKey('a')]: 'nonsense', theme: 'dark', other: 1 }
    expect(stateFromData(data).customSites).toEqual([])
  })

  it('reads preset and category settings', () => {
    const data = { presetEnabled: { 'social-x': false }, categories: { social: true, shortForm: 'yes' } }
    const state = stateFromData(data)
    expect(state.presetEnabled).toEqual({ 'social-x': false })
    expect(state.categories).toEqual({ social: true, shortForm: false })
  })
})

describe('diffState', () => {
  const base: BlockListState = { ...DEFAULT_STATE, customSites: [site('a'), site('b')] }

  it('writes nothing when nothing changed', () => {
    expect(diffState(base, { ...base })).toEqual({ set: {}, remove: [] })
  })

  it('writes only the site that changed', () => {
    const next = { ...base, customSites: [site('a'), site('b', { enabled: false })] }
    expect(diffState(base, next)).toEqual({ set: { [siteKey('b')]: next.customSites[1] }, remove: [] })
  })

  it('writes the new site and the order when a site is added', () => {
    const added = site('c')
    const result = diffState(base, { ...base, customSites: [...base.customSites, added] })
    expect(result.set).toEqual({ [siteKey('c')]: added, customOrder: ['a', 'b', 'c'] })
    expect(result.remove).toEqual([])
  })

  it('removes a deleted site and updates the order', () => {
    const result = diffState(base, { ...base, customSites: [base.customSites[0]] })
    expect(result).toEqual({ set: { customOrder: ['a'] }, remove: [siteKey('b')] })
  })

  it('writes presets and categories only when they change', () => {
    const next = { ...base, presetEnabled: { 'social-x': false }, categories: { social: true, shortForm: false } }
    expect(diffState(base, next).set).toEqual({ presetEnabled: next.presetEnabled, categories: next.categories })
  })

  it('round-trips: applying the diff gives back the new state', () => {
    const next: BlockListState = {
      customSites: [site('b'), site('c', { dailyLimit: 15 })],
      presetEnabled: { 'social-x': false },
      categories: { social: true, shortForm: true },
    }
    const { set, remove } = diffState(base, next)
    const stored: Record<string, unknown> = {
      customOrder: ['a', 'b'],
      [siteKey('a')]: base.customSites[0],
      [siteKey('b')]: base.customSites[1],
    }
    Object.assign(stored, set)
    remove.forEach((key) => delete stored[key])
    expect(stateFromData(stored)).toEqual(next)
  })
})
