import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE, addUsage, dayKey, exhaustedUrls, parseLimit, secondsUsed, usageToday } from './usage'

const TODAY = '2026-10-12'
const sites = [
  { name: 'YouTube', url: 'youtube.com', limitMinutes: 20 },
  { name: 'X', url: 'x.com', limitMinutes: 5 },
]

describe('dayKey', () => {
  it('uses the local calendar date', () => {
    expect(dayKey(new Date(2026, 9, 12, 23, 59))).toBe('2026-10-12')
    expect(dayKey(new Date(2026, 9, 13, 0, 0))).toBe('2026-10-13')
    expect(dayKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05')
  })
})

describe('usage over a day', () => {
  it('adds time per site', () => {
    let usage = addUsage(EMPTY_USAGE, ['youtube.com'], 30, TODAY)
    usage = addUsage(usage, ['youtube.com', 'x.com'], 30, TODAY)
    expect(secondsUsed(usage, 'youtube.com', TODAY)).toBe(60)
    expect(secondsUsed(usage, 'x.com', TODAY)).toBe(30)
    expect(secondsUsed(usage, 'reddit.com', TODAY)).toBe(0)
  })

  it('resets at midnight: yesterday counts as zero and is replaced on the next write', () => {
    const yesterday = addUsage(EMPTY_USAGE, ['youtube.com'], 600, '2026-10-11')
    expect(secondsUsed(yesterday, 'youtube.com', TODAY)).toBe(0)
    expect(usageToday(yesterday, TODAY)).toEqual({ date: TODAY, seconds: {} })
    expect(addUsage(yesterday, ['youtube.com'], 30, TODAY)).toEqual({
      date: TODAY,
      seconds: { 'youtube.com': 30 },
    })
  })

  it('ignores empty or non-positive additions', () => {
    expect(addUsage(EMPTY_USAGE, [], 30, TODAY)).toEqual({ date: TODAY, seconds: {} })
    expect(addUsage(EMPTY_USAGE, ['x.com'], 0, TODAY)).toEqual({ date: TODAY, seconds: {} })
  })
})

describe('exhaustedUrls', () => {
  it('lists sites at or over their limit, sorted', () => {
    const usage = addUsage(addUsage(EMPTY_USAGE, ['x.com'], 300, TODAY), ['youtube.com'], 1199, TODAY)
    expect(exhaustedUrls(sites, usage, TODAY)).toEqual(['x.com'])
    expect(exhaustedUrls(sites, addUsage(usage, ['youtube.com'], 1, TODAY), TODAY)).toEqual(['x.com', 'youtube.com'])
  })

  it('is empty on a fresh day', () => {
    const usage = addUsage(EMPTY_USAGE, ['x.com'], 9999, '2026-10-11')
    expect(exhaustedUrls(sites, usage, TODAY)).toEqual([])
  })
})

describe('parseLimit', () => {
  it('treats empty as no limit', () => {
    expect(parseLimit('')).toEqual({ ok: true, minutes: undefined })
    expect(parseLimit('   ')).toEqual({ ok: true, minutes: undefined })
  })

  it('accepts whole minutes in range', () => {
    expect(parseLimit('20')).toEqual({ ok: true, minutes: 20 })
    expect(parseLimit('1')).toEqual({ ok: true, minutes: 1 })
    expect(parseLimit('1440')).toEqual({ ok: true, minutes: 1440 })
  })

  it.each(['0', '-5', '1.5', 'abc', '1441', '20 min'])('rejects %j', (text) => {
    expect(parseLimit(text)).toMatchObject({ ok: false })
  })
})
