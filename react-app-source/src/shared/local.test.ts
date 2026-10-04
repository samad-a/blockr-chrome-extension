import { describe, expect, it } from 'vitest'
import { isPaused } from './local'

describe('isPaused', () => {
  it('is false when there is no pause', () => {
    expect(isPaused(null)).toBe(false)
  })

  it('is true for an indefinite pause', () => {
    expect(isPaused({ until: null })).toBe(true)
  })

  it('is true until the timestamp, false after', () => {
    expect(isPaused({ until: 2000 }, 1000)).toBe(true)
    expect(isPaused({ until: 2000 }, 2000)).toBe(false)
    expect(isPaused({ until: 2000 }, 3000)).toBe(false)
  })
})
