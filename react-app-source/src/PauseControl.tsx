import { useEffect, useRef, useState } from 'react'
import { isPaused, setPause } from './shared/local'
import type { Pause } from './shared/local'

const MINUTE = 60_000

const PAUSE_OPTIONS: { label: string; until: () => number }[] = [
  { label: '15 minutes', until: () => Date.now() + 15 * MINUTE },
  { label: '1 hour', until: () => Date.now() + 60 * MINUTE },
  {
    label: 'until tomorrow',
    until: () => {
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      return midnight.getTime()
    },
  },
]

/** "disable" / "enable" button with a drop-down for pausing blocking for a while. */
type PauseControlProps = {
  pause: Pause
  /** Runs the action now, or after the password is entered when a lock is set. */
  requireUnlock: (action: () => void) => void
}

export function PauseControl({ pause, requireUnlock }: PauseControlProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const paused = isPaused(pause)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="split" ref={ref}>
      <button
        id="disableButton"
        className="split-main"
        // Resuming blocking is always allowed; pausing it needs the password.
        onClick={() => (paused ? setPause(null) : requireUnlock(() => setPause({ until: null })))}
      >
        {paused ? 'enable' : 'disable'}
      </button>
      <button
        className="split-chevron"
        aria-label="Pause for a set time"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path d="M2 4.5 7 9.5 12 4.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="pause-menu" role="menu">
          <p className="pause-menu-title">pause for</p>
          {PAUSE_OPTIONS.map((option) => (
            <button
              key={option.label}
              role="menuitem"
              className="menu-item"
              onClick={() => {
                setOpen(false)
                requireUnlock(() => setPause({ until: option.until() }))
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
