import { describe, expect, it } from 'vitest'
import { RESET_DELAY_MS, formatDuration, isUnlocked, lockoutMs, resetDue } from './lock'

describe('isUnlocked', () => {
  it('is true only before the expiry time', () => {
    expect(isUnlocked(null, 1000)).toBe(false)
    expect(isUnlocked(2000, 1000)).toBe(true)
    expect(isUnlocked(1000, 1000)).toBe(false)
  })
})

describe('resetDue', () => {
  it('is due once the wait has passed', () => {
    expect(resetDue(null, 5)).toBe(false)
    expect(resetDue(100, 99)).toBe(false)
    expect(resetDue(100, 100)).toBe(true)
  })

  it('waits six hours', () => {
    expect(RESET_DELAY_MS).toBe(6 * 60 * 60 * 1000)
  })
})

describe('lockoutMs', () => {
  it('allows a few free attempts, then backs off up to a cap', () => {
    expect(lockoutMs(0)).toBe(0)
    expect(lockoutMs(4)).toBe(0)
    expect(lockoutMs(5)).toBe(30_000)
    expect(lockoutMs(6)).toBe(60_000)
    expect(lockoutMs(7)).toBe(120_000)
    expect(lockoutMs(50)).toBe(15 * 60_000)
  })
})

describe('formatDuration', () => {
  it('formats hours, minutes and seconds', () => {
    expect(formatDuration(5 * 3600_000 + 42 * 60_000)).toBe('5h 42m')
    expect(formatDuration(12 * 60_000)).toBe('12m')
    expect(formatDuration(30_000)).toBe('30s')
    expect(formatDuration(-5)).toBe('0s')
  })
})
