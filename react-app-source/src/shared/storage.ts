import type { BlockListState } from './types'

export const DEFAULT_STATE: BlockListState = {
  customSites: [],
  presetEnabled: {},
  categories: { social: false, shortForm: false },
}

export async function loadState(): Promise<BlockListState> {
  // Passing the defaults makes get() fill in any missing keys.
  return (await chrome.storage.sync.get(DEFAULT_STATE)) as BlockListState
}
