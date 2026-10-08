import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CURRENT_VERSION, detectVersion, ensureMigrated, planMigration } from './migrations'
import { loadStateWithStatus, saveState } from './storage'
import { ORDER_KEY, VERSION_KEY, siteKey } from './storageLayout'
import type { BlockListState } from './types'

const oldSite = (id: string, extra = {}) => ({ id, name: id, url: `${id}.com`, dateAdded: 1, enabled: true, ...extra })

describe('detectVersion', () => {
  it('treats Blockr 1.0 data (no version, customSites array) as version 1', () => {
    expect(detectVersion({ customSites: [] })).toBe(1)
    expect(detectVersion({ presetEnabled: {} })).toBe(1)
  })

  it('treats empty data as brand new (nothing to upgrade)', () => {
    expect(detectVersion({})).toBe(CURRENT_VERSION)
    expect(detectVersion({ theme: 'dark' })).toBe(CURRENT_VERSION)
  })

  it('reads a stored version, including newer ones', () => {
    expect(detectVersion({ schemaVersion: 2 })).toBe(2)
    expect(detectVersion({ schemaVersion: 99 })).toBe(99)
  })
})

describe('planMigration', () => {
  it('splits the old array into one entry per site and removes the old key', () => {
    const plan = planMigration({
      customSites: [oldSite('a', { dailyLimit: 20 }), oldSite('b')],
      presetEnabled: { 'social-x': false },
    })
    expect(plan?.from).toBe(1)
    expect(plan?.set).toMatchObject({
      [siteKey('a')]: oldSite('a', { dailyLimit: 20 }),
      [siteKey('b')]: oldSite('b'),
      [ORDER_KEY]: ['a', 'b'],
      [VERSION_KEY]: CURRENT_VERSION,
    })
    expect(plan?.remove).toEqual(['customSites'])
  })

  it('drops unusable and duplicate entries', () => {
    const plan = planMigration({ customSites: [oldSite('a'), 'junk', oldSite('a'), { id: 'x' }] })
    expect(plan?.set[ORDER_KEY]).toEqual(['a'])
  })

  it('handles version-1 data that has no custom sites at all', () => {
    const plan = planMigration({ categories: { social: true, shortForm: false, adult: false } })
    expect(plan?.set).toMatchObject({ [ORDER_KEY]: [], [VERSION_KEY]: CURRENT_VERSION })
  })

  it('does nothing for current data', () => {
    expect(planMigration({ schemaVersion: CURRENT_VERSION, [ORDER_KEY]: [] })).toBeNull()
  })

  it('stamps the version on a brand-new install, without touching anything else', () => {
    expect(planMigration({})).toEqual({ from: CURRENT_VERSION, set: { [VERSION_KEY]: CURRENT_VERSION }, remove: [] })
  })

  it('never touches data from a newer Blockr', () => {
    expect(planMigration({ schemaVersion: CURRENT_VERSION + 1, customSites: [oldSite('a')] })).toBeNull()
  })

  it('cleans up a leftover old key when an earlier run was interrupted', () => {
    const plan = planMigration({ schemaVersion: CURRENT_VERSION, customSites: [oldSite('a')] })
    expect(plan?.remove).toEqual(['customSites'])
  })
})

/** In-memory stand-in for a chrome.storage area. */
function fakeArea() {
  let data: Record<string, unknown> = {}
  return {
    get: async (keys?: unknown) => {
      if (keys === null || keys === undefined) return { ...data }
      if (typeof keys === 'object') return { ...(keys as object), ...data }
      return {}
    },
    set: vi.fn(async (items: Record<string, unknown>) => void Object.assign(data, structuredClone(items))),
    remove: vi.fn(async (keys: string | string[]) => void [keys].flat().forEach((key) => delete data[key])),
    snapshot: () => ({ ...data }),
    reset: (next: Record<string, unknown> = {}) => (data = structuredClone(next)),
  }
}

const sync = fakeArea()
const local = fakeArea()

beforeEach(() => {
  sync.reset()
  local.reset()
  sync.set.mockClear()
  sync.remove.mockClear()
  vi.stubGlobal('chrome', { storage: { sync, local } })
})

describe('upgrading real stored data', () => {
  const v1 = {
    customSites: [oldSite('a', { dailyLimit: 20 }), oldSite('b', { enabled: false })],
    presetEnabled: { 'social-x': false },
    categories: { social: true, shortForm: false, adult: false },
    theme: 'dark',
  }

  it('keeps every site, setting and unrelated key, and leaves a backup', async () => {
    sync.reset(v1)
    await ensureMigrated()

    const stored = sync.snapshot()
    expect(stored.customSites).toBeUndefined()
    expect(stored[VERSION_KEY]).toBe(CURRENT_VERSION)
    expect(stored.theme).toBe('dark')

    const { state, readOnly } = await loadStateWithStatus()
    expect(readOnly).toBe(false)
    expect(state.customSites).toEqual(v1.customSites)
    expect(state.presetEnabled).toEqual(v1.presetEnabled)
    expect(state.categories).toEqual(v1.categories)

    const backup = local.snapshot().syncBackup as { fromVersion: number; data: Record<string, unknown> }
    expect(backup.fromVersion).toBe(1)
    expect(backup.data.customSites).toEqual(v1.customSites)
  })

  it('is safe to run twice', async () => {
    sync.reset(v1)
    await ensureMigrated()
    const once = sync.snapshot()
    sync.set.mockClear()
    await ensureMigrated()
    expect(sync.snapshot()).toEqual(once)
    expect(sync.set).not.toHaveBeenCalled()
  })

  it('migrates on load without a separate call', async () => {
    sync.reset(v1)
    const { state } = await loadStateWithStatus()
    expect(state.customSites).toHaveLength(2)
    expect(sync.snapshot()[VERSION_KEY]).toBe(CURRENT_VERSION)
  })

  it('reports newer data as read-only and leaves it alone', async () => {
    const future = { schemaVersion: CURRENT_VERSION + 1, futureThing: { x: 1 } }
    sync.reset(future)
    const { readOnly } = await loadStateWithStatus()
    expect(readOnly).toBe(true)
    expect(sync.snapshot()).toEqual(future)
    expect(sync.set).not.toHaveBeenCalled()
  })

  it('saves edits as per-site writes', async () => {
    sync.reset(v1)
    const { state } = await loadStateWithStatus()
    sync.set.mockClear()
    const next: BlockListState = {
      ...state,
      customSites: [{ ...state.customSites[0], dailyLimit: 30 }, state.customSites[1]],
    }
    await saveState(state, next)
    expect(sync.set).toHaveBeenCalledTimes(1)
    expect(Object.keys(sync.set.mock.calls[0][0])).toEqual([siteKey('a')])
  })
})
