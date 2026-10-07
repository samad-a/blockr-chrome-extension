import { useState } from 'react'
import type { FormEvent } from 'react'
import { UNLOCK_MS } from '../../shared/lock'
import { lockNow, removePassword, setPassword } from '../../shared/lockActions'
import { validateNewPassword } from '../../shared/password'

/** Set, change or remove the lock password. Only reachable while unlocked. */
export function PasswordSettings({ hasPassword }: { hasPassword: boolean }) {
  const [password, setPasswordText] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = validateNewPassword(password, confirm)
    if (problem) {
      setMessage({ text: problem, error: true })
      return
    }
    setBusy(true)
    await setPassword(password)
    setBusy(false)
    setPasswordText('')
    setConfirm('')
    setMessage({
      text: hasPassword
        ? 'Password changed.'
        : `Password set. This page stays open for now and locks after ${UNLOCK_MS / 60_000} minutes of inactivity, or press “lock now”.`,
      error: false,
    })
  }

  return (
    <section className="settings-section">
      <h3>Password protection</h3>
      <p className="settings-help">
        {hasPassword
          ? 'A password is needed to open this page, and to pause or turn off blocking from the popup.'
          : 'Ask for a password before blocking can be paused, turned off, or changed.'}
      </p>

      <form className="password-form" onSubmit={submit}>
        <input
          className="text-input"
          type="password"
          placeholder={hasPassword ? 'New password' : 'Password'}
          aria-label={hasPassword ? 'New password' : 'Password'}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPasswordText(e.target.value)}
        />
        <input
          className="text-input"
          type="password"
          placeholder="Confirm password"
          aria-label="Confirm password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button type="submit" className="pill" disabled={busy}>
          {hasPassword ? 'change password' : 'set password'}
        </button>
      </form>

      {message && (
        <p className="settings-message" role={message.error ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}

      {hasPassword && (
        <div className="password-actions">
          <button type="button" className="pill pill-light" onClick={() => lockNow()}>
            lock now
          </button>
          <button
            type="button"
            className="pill pill-light"
            onClick={() => {
              if (window.confirm('Remove the password? Blocking will no longer be protected.')) removePassword()
            }}
          >
            remove password
          </button>
        </div>
      )}

      <p className="settings-note">
        This is a speed bump, not a vault: it stops quick, impulsive changes. Someone determined could still turn
        Blockr off or remove it on the Chrome extensions page. The password is stored only as a salted hash on this
        device, so it isn&rsquo;t synced, and reinstalling the extension clears it.
      </p>
    </section>
  )
}
