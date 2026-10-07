// Block list storage (chrome.storage.sync).
//
// Layout (schema version 2):
//   schemaVersion  number
//   customOrder    string[]            ids of the custom sites, in display order
//   site:<id>      CustomSite          one entry per custom site
//   presetEnabled  Record<id, boolean>
//   categories     Record<category, boolean>
//
// One entry per site keeps every entry far below Chrome's 8 KB per-item limit
// (about 400-500 sites fit in the 100 KB total) and means editing one site only
// writes that site. Older data is upgraded by migrations.ts.
import { MAX_LIMIT_MINUTES } from './usage'
import type { BlockListState, CustomSite } from './types'

export type SyncData = Record<string, unknown>

export const DEFAULT_STATE: BlockListState = {
  customSites: [],
  presetEnabled: {},
  categories: { social: false, shortForm: false },
}

export const SITE_PREFIX = 'site:'
export const ORDER_KEY = 'customOrder'
export const VERSION_KEY = 'schemaVersion'

export const siteKey = (id: string) => `${SITE_PREFIX}${id}`

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Turns whatever is stored (or imported) into a valid site, or null if it isn't usable. */
export function sanitizeSite(raw: unknown): CustomSite | null {
  if (!isRecord(raw)) return null
  const { id, name, url, dateAdded, enabled, dailyLimit } = raw
  if (typeof id !== 'string' || id === '' || typeof url !== 'string' || url === '') return null
  const limit =
    typeof dailyLimit === 'number' && Number.isInteger(dailyLimit) && dailyLimit >= 1 && dailyLimit <= MAX_LIMIT_MINUTES
      ? { dailyLimit }
      : {}
  return {
    id,
    name: typeof name === 'string' && name !== '' ? name : url,
    url,
    dateAdded: typeof dateAdded === 'number' ? dateAdded : 0,
    enabled: enabled !== false,
    ...limit,
  }
}

/** Builds the app state from the raw synced data (current layout). */
export function stateFromData(data: SyncData): BlockListState {
  const bySite = new Map<string, CustomSite>()
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith(SITE_PREFIX)) continue
    const site = sanitizeSite(value)
    if (site) bySite.set(site.id, site)
  }

  const order = Array.isArray(data[ORDER_KEY]) ? (data[ORDER_KEY] as unknown[]).filter((id) => typeof id === 'string') : []
  const customSites: CustomSite[] = []
  for (const id of order as string[]) {
    const site = bySite.get(id)
    if (site) {
      customSites.push(site)
      bySite.delete(id)
    }
  }
  // Sites that arrived (e.g. from another device) before the order list did go last, oldest first.
  customSites.push(...[...bySite.values()].sort((a, b) => a.dateAdded - b.dateAdded))

  const categories = isRecord(data.categories) ? data.categories : {}
  return {
    customSites,
    presetEnabled: isRecord(data.presetEnabled) ? (data.presetEnabled as Record<string, boolean>) : {},
    categories: { social: categories.social === true, shortForm: categories.shortForm === true },
  }
}

const sameSite = (a: CustomSite, b: CustomSite) =>
  a.name === b.name && a.url === b.url && a.dateAdded === b.dateAdded && a.enabled === b.enabled && a.dailyLimit === b.dailyLimit

/** The storage writes needed to turn `previous` into `next`: only what changed. */
export function diffState(previous: BlockListState, next: BlockListState): { set: SyncData; remove: string[] } {
  const set: SyncData = {}
  const remove: string[] = []

  const before = new Map(previous.customSites.map((site) => [site.id, site]))
  const after = new Set(next.customSites.map((site) => site.id))
  for (const site of next.customSites) {
    const old = before.get(site.id)
    if (!old || !sameSite(old, site)) set[siteKey(site.id)] = site
  }
  for (const id of before.keys()) {
    if (!after.has(id)) remove.push(siteKey(id))
  }

  const ids = next.customSites.map((site) => site.id)
  if (ids.join('\n') !== previous.customSites.map((site) => site.id).join('\n')) set[ORDER_KEY] = ids

  if (JSON.stringify(previous.presetEnabled) !== JSON.stringify(next.presetEnabled)) set.presetEnabled = next.presetEnabled
  if (JSON.stringify(previous.categories) !== JSON.stringify(next.categories)) set.categories = next.categories
  return { set, remove }
}
