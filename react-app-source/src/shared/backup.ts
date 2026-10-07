// Export and import of the custom block list as a small JSON file.
import type { CustomSite } from './types'
import { validateSite } from './url'
import { parseLimit } from './usage'

/** Most custom sites allowed. Chrome's sync storage holds ~500 entries and 100 KB; this leaves headroom. */
export const MAX_CUSTOM_SITES = 400

/** Bigger files are rejected without being read. */
export const MAX_IMPORT_BYTES = 1_000_000

const FORMAT = 'blockr-custom-list'
const NAME_MAX_LENGTH = 60

export type ImportedSite = {
  name: string
  url: string
  enabled: boolean
  dateAdded?: number
  dailyLimit?: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** The file contents for "export list". Ids are left out; they're made fresh on import. */
export function exportList(sites: CustomSite[], now: Date = new Date()): string {
  return JSON.stringify(
    {
      format: FORMAT,
      version: 1,
      exportedAt: now.toISOString(),
      sites: sites.map(({ name, url, enabled, dateAdded, dailyLimit }) => ({
        name,
        url,
        enabled,
        dateAdded,
        ...(dailyLimit ? { dailyLimit } : {}),
      })),
    },
    null,
    2,
  )
}

export const exportFileName = (now: Date = new Date()) => `blockr-list-${now.toISOString().slice(0, 10)}.json`

export type ParsedImport = { sites: ImportedSite[]; invalid: number } | { error: string }

/** Reads an import file. Every entry is checked with the same rules as the "add site" form. */
export function parseImport(text: string): ParsedImport {
  if (text.length > MAX_IMPORT_BYTES) return { error: 'That file is too large to be a Blockr list.' }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { error: 'That file isn’t a Blockr list (it isn’t valid JSON).' }
  }

  if (isRecord(data) && data.format !== undefined && data.format !== FORMAT) {
    return { error: 'That file isn’t a Blockr list.' }
  }
  const entries = Array.isArray(data) ? data : isRecord(data) && Array.isArray(data.sites) ? data.sites : null
  if (!entries) return { error: 'No sites found in that file.' }

  const sites: ImportedSite[] = []
  const seen: string[] = []
  let invalid = 0
  for (const entry of entries.slice(0, MAX_CUSTOM_SITES * 2)) {
    if (!isRecord(entry) || typeof entry.url !== 'string') {
      invalid++
      continue
    }
    const name = typeof entry.name === 'string' ? entry.name.slice(0, NAME_MAX_LENGTH) : ''
    const checked = validateSite(name, entry.url, seen)
    if (!checked.ok) {
      invalid++
      continue
    }
    seen.push(checked.url)

    const limit = parseLimit(typeof entry.dailyLimit === 'number' ? String(entry.dailyLimit) : '')
    const dateAdded = typeof entry.dateAdded === 'number' && Number.isFinite(entry.dateAdded) && entry.dateAdded > 0 ? entry.dateAdded : undefined
    sites.push({
      name: checked.name,
      url: checked.url,
      enabled: entry.enabled !== false,
      ...(dateAdded ? { dateAdded } : {}),
      ...(limit.ok && limit.minutes ? { dailyLimit: limit.minutes } : {}),
    })
  }
  invalid += Math.max(0, entries.length - MAX_CUSTOM_SITES * 2)
  return { sites, invalid }
}

export type MergeResult = {
  sites: CustomSite[]
  added: number
  skippedDuplicates: number
  skippedOverCap: number
}

/** Adds imported sites after the existing ones. Never changes or removes what's already there. */
export function mergeImport(
  existing: CustomSite[],
  imported: ImportedSite[],
  newId: () => string,
  now: number = Date.now(),
): MergeResult {
  const urls = new Set(existing.map((site) => site.url))
  const added: CustomSite[] = []
  let skippedDuplicates = 0
  let skippedOverCap = 0

  for (const site of imported) {
    if (urls.has(site.url)) {
      skippedDuplicates++
      continue
    }
    if (existing.length + added.length >= MAX_CUSTOM_SITES) {
      skippedOverCap++
      continue
    }
    urls.add(site.url)
    added.push({
      id: newId(),
      name: site.name,
      url: site.url,
      dateAdded: site.dateAdded ?? now,
      enabled: site.enabled,
      ...(site.dailyLimit ? { dailyLimit: site.dailyLimit } : {}),
    })
  }
  return { sites: [...existing, ...added], added: added.length, skippedDuplicates, skippedOverCap }
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** "Added 12 sites. Skipped 3 duplicates and 2 invalid entries." */
export function describeImport(result: MergeResult, invalid: number): string {
  const skipped = [
    result.skippedDuplicates > 0 && plural(result.skippedDuplicates, 'duplicate'),
    invalid > 0 && `${plural(invalid, 'invalid entry').replace('entrys', 'entries')}`,
    result.skippedOverCap > 0 && `${plural(result.skippedOverCap, 'site')} over the ${MAX_CUSTOM_SITES}-site limit`,
  ].filter(Boolean) as string[]

  const added = result.added === 0 ? 'No new sites added.' : `Added ${plural(result.added, 'site')}.`
  if (skipped.length === 0) return added
  const list = skipped.length > 1 ? `${skipped.slice(0, -1).join(', ')} and ${skipped[skipped.length - 1]}` : skipped[0]
  return `${added} Skipped ${list}.`
}
