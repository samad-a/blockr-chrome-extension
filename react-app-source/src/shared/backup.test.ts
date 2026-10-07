import { describe, expect, it } from 'vitest'
import {
  MAX_CUSTOM_SITES,
  describeImport,
  exportFileName,
  exportList,
  mergeImport,
  parseImport,
} from './backup'
import type { CustomSite } from './types'

const site = (id: string, overrides: Partial<CustomSite> = {}): CustomSite => ({
  id,
  name: id,
  url: `${id}.com`,
  dateAdded: 1000,
  enabled: true,
  ...overrides,
})

describe('export and import round trip', () => {
  it('exports names, addresses, state, dates and limits, but not ids', () => {
    const text = exportList([site('a', { dailyLimit: 20, enabled: false }), site('b')], new Date('2026-10-13T10:00:00Z'))
    const data = JSON.parse(text)
    expect(data.format).toBe('blockr-custom-list')
    expect(data.exportedAt).toBe('2026-10-13T10:00:00.000Z')
    expect(data.sites).toEqual([
      { name: 'a', url: 'a.com', enabled: false, dateAdded: 1000, dailyLimit: 20 },
      { name: 'b', url: 'b.com', enabled: true, dateAdded: 1000 },
    ])
    expect(text).not.toContain('"id"')
  })

  it('imports what it exported', () => {
    const original = [site('a', { dailyLimit: 20, enabled: false }), site('b')]
    const parsed = parseImport(exportList(original))
    expect('error' in parsed).toBe(false)
    if ('error' in parsed) return
    expect(parsed.invalid).toBe(0)
    expect(parsed.sites).toEqual([
      { name: 'a', url: 'a.com', enabled: false, dateAdded: 1000, dailyLimit: 20 },
      { name: 'b', url: 'b.com', enabled: true, dateAdded: 1000 },
    ])
  })

  it('names the file by date', () => {
    expect(exportFileName(new Date('2026-10-13T23:59:00Z'))).toBe('blockr-list-2026-10-13.json')
  })
})

describe('parseImport', () => {
  it.each(['', 'not json', '{', '123', '"hi"', 'null'])('rejects %j', (text) => {
    expect(parseImport(text)).toHaveProperty('error')
  })

  it('rejects files from something else and files with no sites', () => {
    expect(parseImport(JSON.stringify({ format: 'other', sites: [] }))).toHaveProperty('error')
    expect(parseImport(JSON.stringify({ hello: 'world' }))).toHaveProperty('error')
  })

  it('rejects a file that is far too large', () => {
    expect(parseImport('x'.repeat(1_000_001))).toHaveProperty('error')
  })

  it('accepts a bare list and normalises addresses', () => {
    const parsed = parseImport(JSON.stringify([{ name: 'Tik', url: 'https://www.TikTok.com/?x=1' }, { url: 'reddit.com' }]))
    expect(parsed).toEqual({
      sites: [
        { name: 'Tik', url: 'tiktok.com', enabled: true },
        { name: 'Reddit', url: 'reddit.com', enabled: true },
      ],
      invalid: 0,
    })
  })

  it('counts invalid entries and duplicates inside the file', () => {
    const parsed = parseImport(
      JSON.stringify({
        sites: [{ url: 'a.com' }, { url: 'A.com' }, { url: 'nope' }, 5, { name: 'x' }, { url: '<script>.com' }, null],
      }),
    )
    expect(parsed).toMatchObject({ invalid: 6 })
    if (!('error' in parsed)) expect(parsed.sites.map((s) => s.url)).toEqual(['a.com'])
  })

  it('keeps the site but drops a nonsense limit, and ignores unexpected fields', () => {
    const parsed = parseImport(
      JSON.stringify([
        { url: 'a.com', dailyLimit: -3, evil: '<img onerror=x>', enabled: false },
        { url: 'b.com', dailyLimit: 15 },
        { url: 'c.com', dailyLimit: '20' },
      ]),
    )
    if ('error' in parsed) throw new Error(parsed.error)
    expect(parsed.sites).toEqual([
      { name: 'A', url: 'a.com', enabled: false },
      { name: 'B', url: 'b.com', enabled: true, dailyLimit: 15 },
      { name: 'C', url: 'c.com', enabled: true },
    ])
  })

  it('truncates very long names', () => {
    const parsed = parseImport(JSON.stringify([{ name: 'x'.repeat(500), url: 'a.com' }]))
    if ('error' in parsed) throw new Error(parsed.error)
    expect(parsed.sites[0].name).toHaveLength(60)
  })
})

describe('mergeImport', () => {
  let counter = 0
  const newId = () => `new${++counter}`

  it('adds new sites after the existing ones and leaves existing ones untouched', () => {
    const existing = [site('a', { dailyLimit: 10 })]
    const result = mergeImport(
      existing,
      [{ name: 'B', url: 'b.com', enabled: true, dailyLimit: 5 }, { name: 'Dup', url: 'a.com', enabled: false }],
      newId,
      5000,
    )
    expect(result.added).toBe(1)
    expect(result.skippedDuplicates).toBe(1)
    expect(result.sites[0]).toBe(existing[0])
    expect(result.sites[1]).toMatchObject({ name: 'B', url: 'b.com', dateAdded: 5000, dailyLimit: 5, enabled: true })
    expect(result.sites[1].id).toMatch(/^new/)
  })

  it('keeps imported dates and stops at the site limit', () => {
    const existing = Array.from({ length: MAX_CUSTOM_SITES - 1 }, (_, i) => site(`s${i}`))
    const result = mergeImport(
      existing,
      [
        { name: 'One', url: 'one.com', enabled: true, dateAdded: 42 },
        { name: 'Two', url: 'two.com', enabled: true },
      ],
      newId,
    )
    expect(result.added).toBe(1)
    expect(result.skippedOverCap).toBe(1)
    expect(result.sites).toHaveLength(MAX_CUSTOM_SITES)
    expect(result.sites[MAX_CUSTOM_SITES - 1].dateAdded).toBe(42)
  })
})

describe('describeImport', () => {
  const merged = (added: number, skippedDuplicates = 0, skippedOverCap = 0) => ({ sites: [], added, skippedDuplicates, skippedOverCap })

  it('summarises in plain words', () => {
    expect(describeImport(merged(12), 0)).toBe('Added 12 sites.')
    expect(describeImport(merged(1), 0)).toBe('Added 1 site.')
    expect(describeImport(merged(12, 3), 2)).toBe('Added 12 sites. Skipped 3 duplicates and 2 invalid entries.')
    expect(describeImport(merged(0, 1), 0)).toBe('No new sites added. Skipped 1 duplicate.')
    expect(describeImport(merged(0), 1)).toBe('No new sites added. Skipped 1 invalid entry.')
  })
})
