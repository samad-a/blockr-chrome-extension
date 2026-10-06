import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { formatDuration } from './lock'
import { tryUnlock } from './lockActions'
import './lock.css'

type UnlockFormProps = {
  /** Called after the correct password was entered. */
  onUnlocked: () => void
  /** Wait imposed after too many wrong guesses (epoch ms), from storage. */
  lockedUntil: number
}

export function UnlockForm({ onUnlocked, lockedUntil }: UnlockFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const waitMs = lockedUntil - now

  // Count down the wait between guesses.
  useEffect(() => {
    if (lockedUntil <= Date.now()) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [lockedUntil])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || waitMs > 0) return
    setBusy(true)
    const result = await tryUnlock(password)
    setBusy(false)
    if (result.ok) {
      setPassword('')
      setError(null)
      onUnlocked()
      return
    }
    setPassword('')
    setNow(Date.now())
    setError(result.reason === 'wrong' ? 'Wrong password.' : null)
  }

  const message =
    waitMs > 0 ? `Too many attempts. Try again in ${formatDuration(waitMs)}.` : error

  return (
    <form className="unlock-form" onSubmit={submit}>
      <input
        className="unlock-input"
        type="password"
        placeholder="Password"
        aria-label="Password"
        aria-invalid={error !== null}
        autoComplete="off"
        autoFocus
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          setError(null)
        }}
      />
      <p className="unlock-message" role="alert">
        {message}
      </p>
      <button type="submit" className="unlock-submit" disabled={busy || waitMs > 0 || password === ''}>
        unlock
      </button>
    </form>
  )
}
