import { useState } from 'react'
import blockrIcon from '../../assets/blockr-icon.svg'
import { RESET_DELAY_MS, formatDuration } from '../../shared/lock'
import { cancelReset, requestReset } from '../../shared/lockActions'
import { UnlockForm } from '../../shared/UnlockForm'

type LockScreenProps = {
  resetAt: number | null
  lockedUntil: number
  now: number
}

/** Shown instead of the options page while the password lock is closed. */
export function LockScreen({ resetAt, lockedUntil, now }: LockScreenProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <main className="lock-screen">
      <div className="brand">
        <img src={blockrIcon} alt="" />
        <h1>Blockr</h1>
      </div>
      <h2>Blockr is locked</h2>
      <p>Enter your password to change your block list.</p>

      <UnlockForm lockedUntil={lockedUntil} onUnlocked={() => {}} />

      <div className="lock-reset">
        {resetAt !== null ? (
          <>
            <p>
              Password reset scheduled. It will be removed in <b>{formatDuration(resetAt - now)}</b>.
            </p>
            <button type="button" className="link-button" onClick={() => cancelReset()}>
              cancel the reset
            </button>
          </>
        ) : confirming ? (
          <>
            <p>
              Your password will be removed after a {formatDuration(RESET_DELAY_MS)} wait. You can cancel any time
              before then, and entering your password cancels it too.
            </p>
            <button
              type="button"
              className="link-button"
              onClick={() => {
                requestReset()
                setConfirming(false)
              }}
            >
              start the reset
            </button>{' '}
            <button type="button" className="link-button" onClick={() => setConfirming(false)}>
              never mind
            </button>
          </>
        ) : (
          <button type="button" className="link-button" onClick={() => setConfirming(true)}>
            forgot password?
          </button>
        )}
      </div>
    </main>
  )
}
