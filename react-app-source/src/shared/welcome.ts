import { hasBlocklistData } from './migrations'
import type { SyncData } from './storageLayout'

/** Synced, so reinstalling Blockr or adding a second computer doesn't show the welcome again. */
export const WELCOME_SEEN_KEY = 'welcomeSeen'

/**
 * Should the welcome page open after an install? Only for a genuinely new user:
 * never twice, and not when a list has already synced in from another computer.
 */
export function shouldShowWelcome(syncData: SyncData): boolean {
  return syncData[WELCOME_SEEN_KEY] !== true && !hasBlocklistData(syncData)
}

export const WELCOME_PATH = 'welcome.html'
