import { beforeEach, describe, expect, it, vi } from 'vitest'

// Keep hashing fast in tests (production uses 600k iterations).
vi.mock('./password', async () => {
  const actual = await vi.importActual<typeof import('./password')>('./password')
  return { ...actual, createRecord: (password: string) => actual.createRecord(password, 1000) }
})

import { RESET_DELAY_MS } from './lock'
import { loadLocal } from './local'
import {
  cancelReset,
  completeResetIfDue,
  loadUnlockedUntil,
  lockNow,
  removePassword,
  requestReset,
  setPassword,
  tryUnlock,
} from './lockActions'

/** Minimal in-memory chrome.storage area honouring `get(defaults)`. */
function fakeArea() {
  let data: Record<string, unknown> = {}
  return {
    get: async (defaults: Record<string, unknown>) => ({ ...defaults, ...data }),
    set: async (items: Record<string, unknown>) => void Object.assign(data, items),
    remove: async (key: string) => void delete data[key],
    clear: () => (data = {}),
  }
}

const local = fakeArea()
const session = fakeArea()
const alarms = { create: vi.fn(), clear: vi.fn() }

beforeEach(() => {
  vi.useRealTimers()
  local.clear()
  session.clear()
  alarms.create.mockClear()
  alarms.clear.mockClear()
  vi.stubGlobal('chrome', { storage: { local, session }, alarms })
})

describe('password lock', () => {
  it('unlocks with the right password and rejects a wrong one', async () => {
    await setPassword('hunter22')
    await lockNow()
    expect(await loadUnlockedUntil()).toBeNull()

    expect(await tryUnlock('nope')).toMatchObject({ ok: false, reason: 'wrong' })
    expect(await loadUnlockedUntil()).toBeNull()

    expect(await tryUnlock('hunter22')).toEqual({ ok: true })
    expect(await loadUnlockedUntil()).toBeGreaterThan(Date.now())
  })

  it('never stores the password itself', async () => {
    await setPassword('hunter22')
    expect(JSON.stringify(await loadLocal())).not.toContain('hunter22')
  })

  it('makes the user wait after repeated wrong guesses, even for the right password', async () => {
    await setPassword('hunter22')
    for (let i = 0; i < 4; i++) await tryUnlock('wrong')
    const fifth = await tryUnlock('wrong')
    expect(fifth).toMatchObject({ ok: false, reason: 'wrong', retryInMs: 30_000 })

    expect(await tryUnlock('hunter22')).toMatchObject({ ok: false, reason: 'wait' })
  })

  it('removing the password lets everything through', async () => {
    await setPassword('hunter22')
    await removePassword()
    expect((await loadLocal()).password).toBeNull()
    expect(await tryUnlock('anything')).toEqual({ ok: true })
  })
})

describe('forgot-password reset', () => {
  it('removes the password only after the six-hour wait', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-10T12:00:00Z'))
    await setPassword('hunter22')

    await requestReset()
    expect((await loadLocal()).resetAt).toBe(Date.now() + RESET_DELAY_MS)
    expect(alarms.create).toHaveBeenCalled()

    vi.setSystemTime(Date.now() + RESET_DELAY_MS - 1000)
    expect(await completeResetIfDue()).toBe(false)
    expect((await loadLocal()).password).not.toBeNull()

    vi.setSystemTime(Date.now() + 1000)
    expect(await completeResetIfDue()).toBe(true)
    expect((await loadLocal()).password).toBeNull()
  })

  it('can be cancelled, and entering the password cancels it too', async () => {
    await setPassword('hunter22')

    await requestReset()
    await cancelReset()
    expect((await loadLocal()).resetAt).toBeNull()

    await requestReset()
    expect(await tryUnlock('hunter22')).toEqual({ ok: true })
    expect((await loadLocal()).resetAt).toBeNull()
  })
})
