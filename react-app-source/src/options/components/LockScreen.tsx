import blockrIcon from '../../assets/blockr-icon.svg'
import { ForgotPassword } from '../../shared/ForgotPassword'
import { UnlockForm } from '../../shared/UnlockForm'

type LockScreenProps = {
  resetAt: number | null
  lockedUntil: number
  now: number
}

/** Shown instead of the options page while the password lock is closed. */
export function LockScreen({ resetAt, lockedUntil, now }: LockScreenProps) {
  return (
    <main className="lock-screen">
      <img className="lock-logo" src={blockrIcon} alt="" />
      <h1>Blockr is locked</h1>
      <p>Enter your password to change your block list.</p>

      <UnlockForm lockedUntil={lockedUntil} onUnlocked={() => {}} />

      <div className="lock-reset">
        <ForgotPassword resetAt={resetAt} now={now} />
      </div>
    </main>
  )
}
