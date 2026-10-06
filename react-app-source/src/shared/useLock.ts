import { useEffect, useState } from 'react'
import { isUnlocked } from './lock'
import { completeResetIfDue, extendUnlock, loadUnlockedUntil } from './lockActions'
import { useLocalState } from './useLocalState'

/** How often activity pushes the auto-lock time back. */
const ACTIVITY_THROTTLE_MS = 10_000

/**
 * Whether the password lock is on and currently open, plus a clock that ticks
 * once a second while the lock matters (for countdowns and auto-lock).
 */
export function useLock() {
  const local = useLocalState()
  const [unlockedUntil, setUnlockedUntil] = useState<number | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const hasPassword = local.password !== null
  const unlocked = isUnlocked(unlockedUntil, now)

  useEffect(() => {
    let active = true
    const refresh = () =>
      loadUnlockedUntil().then((value) => {
        if (!active) return
        setUnlockedUntil(value)
        setSessionLoaded(true)
      })
    refresh()
    const onChanged = (_changes: unknown, area: string) => {
      if (area === 'session') refresh()
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      active = false
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  // Finish a pending "forgot password" reset that came due while no page was open.
  useEffect(() => {
    completeResetIfDue()
  }, [])

  useEffect(() => {
    if (!hasPassword) return
    const id = setInterval(() => {
      setNow(Date.now())
      completeResetIfDue()
    }, 1000)
    return () => clearInterval(id)
  }, [hasPassword])

  // Stay unlocked while the user is active; lock after a few minutes of inactivity.
  useEffect(() => {
    if (!hasPassword || !unlocked) return
    let last = 0
    const onActivity = () => {
      const time = Date.now()
      if (time - last < ACTIVITY_THROTTLE_MS) return
      last = time
      extendUnlock()
    }
    window.addEventListener('pointerdown', onActivity)
    window.addEventListener('keydown', onActivity)
    return () => {
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [hasPassword, unlocked])

  return {
    ready: local.loaded && sessionLoaded,
    hasPassword,
    unlocked,
    /** A password is set and hasn't been entered recently. */
    locked: hasPassword && !unlocked,
    resetAt: local.resetAt,
    lockedUntil: local.lockedUntil,
    now,
  }
}
