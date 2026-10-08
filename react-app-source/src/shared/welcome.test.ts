import { describe, expect, it } from 'vitest'
import { notesFor } from './changelog'
import { shouldShowWelcome } from './welcome'

describe('shouldShowWelcome', () => {
  it('shows it to a brand-new user', () => {
    expect(shouldShowWelcome({})).toBe(true)
    expect(shouldShowWelcome({ theme: 'dark' })).toBe(true)
  })

  it('never shows it twice', () => {
    expect(shouldShowWelcome({ welcomeSeen: true })).toBe(false)
  })

  it('skips it when a list has already synced in from another computer', () => {
    expect(shouldShowWelcome({ customOrder: [], 'site:abc': { id: 'abc', url: 'a.com' } })).toBe(false)
    expect(shouldShowWelcome({ customSites: [] })).toBe(false)
    expect(shouldShowWelcome({ categories: { social: true, shortForm: false, adult: false } })).toBe(false)
  })
})

describe('notesFor', () => {
  it('finds the notes for a version, and nothing for versions without any', () => {
    expect(notesFor('1.2')?.highlights.length).toBeGreaterThan(0)
    expect(notesFor('0.0.1')).toBeUndefined()
  })
})
