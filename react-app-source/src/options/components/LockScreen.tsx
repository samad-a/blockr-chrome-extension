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
      <div className="brand">
        <img src={blockrIcon} alt="" />
        <h1>Blockr</h1>
      </div>
      <h2>Blockr is locked</h2>
      <p>Enter your password to change your block list.</p>

      <UnlockForm lockedUntil={lockedUntil} onUnlocked={() => {}} />

      <div className="lock-reset">
        <ForgotPassword resetAt={resetAt} now={now} />
      </div>
    </main>
  )
}
