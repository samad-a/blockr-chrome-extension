// Password lock actions. The password hash, reset timer and failed-attempt
// counters live in chrome.storage.local (this device only); the "unlocked"
// flag lives in chrome.storage.session, which Chrome clears when the browser closes.
import { RESET_DELAY_MS, UNLOCK_MS, lockoutMs, resetDue } from './lock'
import { loadLocal } from './local'
import { createRecord, verifyPassword } from './password'

export const RESET_ALARM = 'blockr-password-reset'
const UNLOCKED_KEY = 'unlockedUntil'

export type UnlockResult =
  | { ok: true }
  | { ok: false; reason: 'wrong' | 'wait'; retryInMs: number }

export async function loadUnlockedUntil(): Promise<number | null> {
  const stored = await chrome.storage.session.get({ [UNLOCKED_KEY]: null })
  return stored[UNLOCKED_KEY] as number | null
}

async function markUnlocked() {
  await chrome.storage.session.set({ [UNLOCKED_KEY]: Date.now() + UNLOCK_MS })
}

export const lockNow = () => chrome.storage.session.remove(UNLOCKED_KEY)

/** Pushes the auto-lock time back; used while the user is active. */
export const extendUnlock = markUnlocked

export async function tryUnlock(password: string): Promise<UnlockResult> {
  const local = await loadLocal()
  if (!local.password) return { ok: true }

  const now = Date.now()
  if (local.lockedUntil > now) return { ok: false, reason: 'wait', retryInMs: local.lockedUntil - now }

  if (await verifyPassword(password, local.password)) {
    // Remembering the password also cancels any pending "forgot password" reset.
    await chrome.storage.local.set({ failures: 0, lockedUntil: 0, resetAt: null })
    await chrome.alarms.clear(RESET_ALARM)
    await markUnlocked()
    return { ok: true }
  }

  const failures = local.failures + 1
  const wait = lockoutMs(failures)
  await chrome.storage.local.set({ failures, lockedUntil: wait > 0 ? now + wait : 0 })
  return { ok: false, reason: 'wrong', retryInMs: wait }
}

export async function setPassword(password: string) {
  const record = await createRecord(password)
  await chrome.storage.local.set({ password: record, resetAt: null, failures: 0, lockedUntil: 0 })
  await chrome.alarms.clear(RESET_ALARM)
  await markUnlocked()
}

export async function removePassword() {
  await chrome.storage.local.set({ password: null, resetAt: null, failures: 0, lockedUntil: 0 })
  await chrome.alarms.clear(RESET_ALARM)
  await lockNow()
}

/** "Forgot password": the password is removed after a waiting period. */
export async function requestReset() {
  const resetAt = Date.now() + RESET_DELAY_MS
  await chrome.storage.local.set({ resetAt })
  await chrome.alarms.create(RESET_ALARM, { when: resetAt })
}

export async function cancelReset() {
  await chrome.storage.local.set({ resetAt: null })
  await chrome.alarms.clear(RESET_ALARM)
}

/** Removes the password if a requested reset has finished waiting. Returns true if it did. */
export async function completeResetIfDue(): Promise<boolean> {
  const { password, resetAt } = await loadLocal()
  if (!password || !resetDue(resetAt)) return false
  await removePassword()
  return true
}

/** Re-creates the reset alarm after a browser restart (alarms don't always survive one). */
export async function rearmResetAlarm() {
  if (await completeResetIfDue()) return
  const { resetAt } = await loadLocal()
  if (resetAt) await chrome.alarms.create(RESET_ALARM, { when: resetAt })
}
