// Daily time-limit bookkeeping. Pure functions; storage lives in local.ts.

/** A site with a daily limit, as seen by the usage tracker. */
export type LimitedSite = { name: string; url: string; limitMinutes: number }

/** Seconds used per normalised block URL, for one calendar day (local time). */
export type Usage = { date: string; seconds: Record<string, number> }

export const EMPTY_USAGE: Usage = { date: '', seconds: {} }

export const MAX_LIMIT_MINUTES = 24 * 60

/** "2026-10-12" in the user's local time zone, so limits reset at local midnight. */
export function dayKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The usage for `today`: yesterday's numbers count as zero. */
export function usageToday(usage: Usage, today: string = dayKey()): Usage {
  return usage.date === today ? usage : { date: today, seconds: {} }
}

export function secondsUsed(usage: Usage, url: string, today: string = dayKey()): number {
  return usageToday(usage, today).seconds[url] ?? 0
}

export function addUsage(usage: Usage, urls: string[], seconds: number, today: string = dayKey()): Usage {
  const current = usageToday(usage, today)
  if (urls.length === 0 || seconds <= 0) return current
  const next = { ...current.seconds }
  for (const url of urls) next[url] = (next[url] ?? 0) + seconds
  return { date: today, seconds: next }
}

export function isExhausted(site: LimitedSite, usage: Usage, today: string = dayKey()): boolean {
  return secondsUsed(usage, site.url, today) >= site.limitMinutes * 60
}

/** URLs whose limit has been used up, sorted so two lists can be compared. */
export function exhaustedUrls(sites: LimitedSite[], usage: Usage, today: string = dayKey()): string[] {
  return sites.filter((site) => isExhausted(site, usage, today)).map((site) => site.url).sort()
}

export type LimitInput = { ok: true; minutes: number | undefined } | { ok: false; error: string }

/** Parses the "minutes per day" field. Empty means no limit. */
export function parseLimit(text: string): LimitInput {
  const trimmed = text.trim()
  if (trimmed === '') return { ok: true, minutes: undefined }
  const minutes = Number(trimmed)
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_LIMIT_MINUTES) {
    return { ok: false, error: `Enter whole minutes between 1 and ${MAX_LIMIT_MINUTES}, or leave it empty.` }
  }
  return { ok: true, minutes }
}
