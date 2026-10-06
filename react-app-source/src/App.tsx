import { useState } from 'react'
import blockrIcon from './assets/blockr-icon.svg'
import { PauseControl } from './PauseControl'
import { Switch } from './shared/Switch'
import { UnlockForm } from './shared/UnlockForm'
import { countBlocked } from './shared/blocking'
import { isPaused } from './shared/local'
import { lockNow } from './shared/lockActions'
import { useTheme } from './shared/theme'
import { useBlockList } from './shared/useBlockList'
import { useLocalState } from './shared/useLocalState'
import { useLock } from './shared/useLock'
import './App.css'

type ToggleProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="row">
      <Switch small label={label} checked={checked} onChange={onChange} />
      <p>{label}</p>
    </div>
  )
}

function LockIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2.5" />
      <path d={open ? 'M8 11V7a4 4 0 0 1 7.5-2' : 'M8 11V7a4 4 0 0 1 8 0v4'} />
    </svg>
  )
}

function App() {
  const { state, update } = useBlockList()
  const { pause } = useLocalState()
  const lock = useLock()
  useTheme()
  // An action waiting for the password, e.g. "pause for 1 hour".
  const [pending, setPending] = useState<{ run: () => void } | null>(null)

  // Wait for storage so the popup doesn't flash "0 sites" (or skip the lock).
  if (!state || !lock.ready) return null

  /** Runs `action` now, or after the password is entered if a lock is set. */
  const requireUnlock = (action: () => void) => {
    if (lock.locked) setPending({ run: action })
    else action()
  }

  const blockedCount = countBlocked(state)
  const paused = isPaused(pause)
  const status = !paused
    ? `blocking ${blockedCount} ${blockedCount === 1 ? 'site' : 'sites'}`
    : pause?.until
      ? `paused until ${new Date(pause.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : 'paused'
  // Turning a category on strengthens blocking and is always allowed; turning it off needs the password.
  const setCategory = (category: 'social' | 'shortForm') => (on: boolean) => {
    const change = () => update((s) => ({ ...s, categories: { ...s.categories, [category]: on } }))
    if (on) change()
    else requireUnlock(change)
  }

  return (
    <div className="popup">
      <div className="title">
        <img src={blockrIcon} id="blockrIcon" alt="" />
        <h1>Blockr</h1>
        {lock.hasPassword && (
          <button
            className="icon-button"
            aria-label={lock.locked ? 'Locked. Enter password' : 'Unlocked. Lock now'}
            title={lock.locked ? 'Locked' : 'Unlocked. Click to lock'}
            onClick={() => (lock.locked ? setPending({ run: () => {} }) : lockNow())}
          >
            <LockIcon open={!lock.locked} />
          </button>
        )}
      </div>

      {pending ? (
        <div className="container">
          <p className="prompt-title">Enter your password</p>
          <UnlockForm
            lockedUntil={lock.lockedUntil}
            onUnlocked={() => {
              pending.run()
              setPending(null)
            }}
          />
          <div className="prompt-links">
            <button className="link-button" onClick={() => setPending(null)}>
              cancel
            </button>
            <button className="link-button" onClick={() => chrome.runtime.openOptionsPage()}>
              forgot password?
            </button>
          </div>
        </div>
      ) : (
        <div className="container">
          <p className={paused || blockedCount === 0 ? 'status idle' : 'status'}>
            <span className="dot" aria-hidden />
            {status}
          </p>
          <PauseControl pause={pause} requireUnlock={requireUnlock} />
          <div className="panel">
            <Toggle
              label="block social media"
              checked={state.categories.social}
              onChange={setCategory('social')}
            />
            <Toggle
              label="block short-form content"
              checked={state.categories.shortForm}
              onChange={setCategory('shortForm')}
            />
          </div>
          <button id="blockListButton" className="secondary" onClick={() => chrome.runtime.openOptionsPage()}>
            edit block list
          </button>
        </div>
      )}
    </div>
  )
}

export default App
