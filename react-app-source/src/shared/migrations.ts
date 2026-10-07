// Upgrades stored data to the layout this version of Blockr expects.
//
// How it works:
//  - The synced data carries a `schemaVersion`. Data from Blockr 1.0 has none and uses
//    the original layout (a single `customSites` array); that is version 1.
//  - MIGRATIONS maps each target version to a function that turns the previous layout into
//    the next one. They run in order, and each must be safe to run twice.
//  - Before anything is changed, a copy of the old data is kept in chrome.storage.local.
//  - Data from a *newer* Blockr (e.g. synced from a computer that updated first) is never
//    touched: this version reads what it can and refuses to write.
import { ORDER_KEY, SITE_PREFIX, VERSION_KEY, sanitizeSite, siteKey } from './storageLayout'
import type { SyncData } from './storageLayout'

export const CURRENT_VERSION = 2

type Migration = (data: SyncData) => { set: SyncData; remove: string[] }

/** Version 1 -> 2: the `customSites` array becomes one `site:<id>` entry per site. */
const toVersion2: Migration = (data) => {
  const legacy = Array.isArray(data.customSites) ? data.customSites : []
  const set: SyncData = {}
  const order: string[] = []
  for (const raw of legacy) {
    const site = sanitizeSite(raw)
    if (!site || order.includes(site.id)) continue
    set[siteKey(site.id)] = site
    order.push(site.id)
  }
  set[ORDER_KEY] = order
  return { set, remove: ['customSites'] }
}

const MIGRATIONS: Record<number, Migration> = { 2: toVersion2 }

/** Keys that mean "Blockr already stored something" (as opposed to a brand-new install). */
export const hasBlocklistData = (data: SyncData) =>
  'customSites' in data || 'presetEnabled' in data || 'categories' in data || Object.keys(data).some((k) => k.startsWith(SITE_PREFIX))

export function detectVersion(data: SyncData): number {
  const stored = data[VERSION_KEY]
  if (typeof stored === 'number' && Number.isInteger(stored) && stored >= 1) return stored
  return hasBlocklistData(data) ? 1 : CURRENT_VERSION // nothing stored yet: nothing to upgrade
}

export type MigrationPlan = { from: number; set: SyncData; remove: string[] }

/** Works out the writes needed to bring `data` up to date, or null if it already is (or is newer). */
export function planMigration(data: SyncData): MigrationPlan | null {
  const from = detectVersion(data)
  if (from > CURRENT_VERSION) return null

  const set: SyncData = {}
  const remove = new Set<string>()
  let working: SyncData = { ...data }
  for (let version = from + 1; version <= CURRENT_VERSION; version++) {
    const result = MIGRATIONS[version](working)
    Object.assign(set, result.set)
    result.remove.forEach((key) => remove.add(key))
    working = { ...working, ...result.set }
    result.remove.forEach((key) => delete working[key])
  }

  // Clean up a leftover old key (e.g. an earlier run was interrupted before it could remove it).
  if (from === CURRENT_VERSION && 'customSites' in data) remove.add('customSites')

  if (data[VERSION_KEY] !== CURRENT_VERSION) set[VERSION_KEY] = CURRENT_VERSION
  if (Object.keys(set).length === 0 && remove.size === 0) return null
  return { from, set, remove: [...remove] }
}

export type MigrationStatus = {
  /** The stored data was written by a newer Blockr: read-only for this version. */
  newer: boolean
}

/** Upgrades the stored data if needed. Safe to call from any extension page or the service worker. */
export async function ensureMigrated(): Promise<MigrationStatus> {
  const data = (await chrome.storage.sync.get(null)) as SyncData
  const plan = planMigration(data)
  if (!plan) return { newer: detectVersion(data) > CURRENT_VERSION }

  // Keep a copy of the old data on this device, in case a migration goes wrong.
  await chrome.storage.local.set({ syncBackup: { takenAt: Date.now(), fromVersion: plan.from, data } })
  await chrome.storage.sync.set(plan.set)
  if (plan.remove.length > 0) await chrome.storage.sync.remove(plan.remove)
  return { newer: false }
}
