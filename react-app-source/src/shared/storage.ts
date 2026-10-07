// Loading and saving the block list. The layout itself is described in storageLayout.ts.
import { CURRENT_VERSION, detectVersion, ensureMigrated, planMigration } from './migrations'
import { diffState, stateFromData } from './storageLayout'
import type { SyncData } from './storageLayout'
import type { BlockListState } from './types'

export { DEFAULT_STATE } from './storageLayout'

export type LoadedState = {
  state: BlockListState
  /** Stored by a newer Blockr: show it, but don't write (it could damage data this version doesn't understand). */
  readOnly: boolean
}

/** Reads the block list, upgrading old stored data first if needed. */
export async function loadStateWithStatus(): Promise<LoadedState> {
  let data = (await chrome.storage.sync.get(null)) as SyncData
  if (planMigration(data)) {
    await ensureMigrated()
    data = (await chrome.storage.sync.get(null)) as SyncData
  }
  return { state: stateFromData(data), readOnly: detectVersion(data) > CURRENT_VERSION }
}

export async function loadState(): Promise<BlockListState> {
  return (await loadStateWithStatus()).state
}

/** Writes only what changed between two states. Rejects if Chrome refuses (e.g. over the sync quota). */
export async function saveState(previous: BlockListState, next: BlockListState): Promise<void> {
  const { set, remove } = diffState(previous, next)
  if (Object.keys(set).length > 0) await chrome.storage.sync.set(set)
  if (remove.length > 0) await chrome.storage.sync.remove(remove)
}
