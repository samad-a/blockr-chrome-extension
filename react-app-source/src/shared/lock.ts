// Pure timing rules for the password lock (no browser APIs, so they're easy to test).

const MINUTE = 60_000
const HOUR = 60 * MINUTE

/** How long the options page / popup stay unlocked after a correct password. */
export const UNLOCK_MS = 5 * MINUTE

/** How long "forgot password" waits before the password is removed. */
export const RESET_DELAY_MS = 6 * HOUR

const FREE_ATTEMPTS = 4

export const isUnlocked = (unlockedUntil: number | null, now = Date.now()) =>
  unlockedUntil !== null && unlockedUntil > now

export const resetDue = (resetAt: number | null, now = Date.now()) => resetAt !== null && resetAt <= now

/** Pause before another guess is allowed, after `failures` wrong attempts in a row. */
export function lockoutMs(failures: number): number {
  if (failures <= FREE_ATTEMPTS) return 0
  // 30s, 1m, 2m, 4m ... capped at 15 minutes.
  return Math.min(30_000 * 2 ** (failures - FREE_ATTEMPTS - 1), 15 * MINUTE)
}

/** "5h 42m", "12m", "30s" */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${totalSeconds}s`
}
