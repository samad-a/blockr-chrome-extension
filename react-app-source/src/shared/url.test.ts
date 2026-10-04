import { describe, expect, it } from 'vitest'
import { formatDate, normalizeUrl, validateSite } from './url'

describe('normalizeUrl', () => {
  it('strips scheme, www, query, hash and trailing slashes', () => {
    expect(normalizeUrl('https://www.TikTok.com/foo/?x=1#top')).toBe('tiktok.com/foo')
    expect(normalizeUrl('  http://tiktok.com/ ')).toBe('tiktok.com')
  })
})

describe('validateSite', () => {
  it('accepts a valid URL and returns it normalised', () => {
    expect(validateSite('Tik Tok', 'https://www.tiktok.com', [])).toEqual({
      ok: true,
      name: 'Tik Tok',
      url: 'tiktok.com',
    })
  })

  it('keeps a path', () => {
    expect(validateSite('Shorts', 'youtube.com/shorts', [])).toMatchObject({
      ok: true,
      url: 'youtube.com/shorts',
    })
  })

  it('falls back to the domain when the name is blank', () => {
    expect(validateSite('  ', 'tiktok.com', [])).toMatchObject({ ok: true, name: 'Tiktok' })
  })

  it.each(['', '   ', 'hello', 'a b.com', 'exa_mple.com', '-bad.com', 'site.c', 'site.com//x'])(
    'rejects %j',
    (input) => {
      expect(validateSite('x', input, [])).toMatchObject({ ok: false })
    },
  )

  it('rejects duplicates, ignoring scheme and www', () => {
    expect(validateSite('x', 'https://www.tiktok.com/', ['tiktok.com'])).toEqual({
      ok: false,
      error: 'That site is already in the list.',
    })
  })
})

describe('formatDate', () => {
  it('formats as DD/MM/YY', () => {
    expect(formatDate(new Date(2025, 8, 30).getTime())).toBe('30/09/25')
    expect(formatDate(new Date(2026, 0, 5).getTime())).toBe('05/01/26')
  })
})
