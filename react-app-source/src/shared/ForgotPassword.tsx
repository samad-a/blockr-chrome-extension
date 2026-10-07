import { useState } from 'react'
import { RESET_DELAY_MS, formatDuration } from './lock'
import { cancelReset, requestReset } from './lockActions'
import './lock.css'

type ForgotPasswordProps = {
  /** When the pending reset completes (epoch ms), or null if none is scheduled. */
  resetAt: number | null
  now: number
}

/**
 * "Forgot password?" flow: start a waiting period after which the password is
 * removed, and cancel it again. Works on its own in both the popup and options page.
 */
export function ForgotPassword({ resetAt, now }: ForgotPasswordProps) {
  const [confirming, setConfirming] = useState(false)

  if (resetAt !== null) {
    return (
      <div className="forgot">
        <p>
          Password reset scheduled. It will be removed in <b>{formatDuration(resetAt - now)}</b>.
        </p>
        <button type="button" className="link-button" onClick={() => cancelReset()}>
          cancel the reset
        </button>
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="forgot">
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
        </button>
        {' · '}
        <button type="button" className="link-button" onClick={() => setConfirming(false)}>
          never mind
        </button>
      </div>
    )
  }

  return (
    <div className="forgot">
      <button type="button" className="link-button" onClick={() => setConfirming(true)}>
        forgot password?
      </button>
    </div>
  )
}
