import { useEffect, useState } from 'react'
import { notesFor } from '../../shared/changelog'

const SHOWN_FOR_KEY = 'whatsNewFor'
const DISMISSED_KEY = 'whatsNewDismissed'

/** Quiet, dismissible note shown once after an update (the background sets `whatsNewFor`). */
export function WhatsNewNotice() {
  const version = chrome.runtime.getManifest().version
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    chrome.storage.local.get({ [SHOWN_FOR_KEY]: null, [DISMISSED_KEY]: null }).then((stored) => {
      setVisible(stored[SHOWN_FOR_KEY] === version && stored[DISMISSED_KEY] !== version)
    })
  }, [version])

  const notes = notesFor(version)
  if (!visible || !notes) return null

  return (
    <div className="notice" role="note">
      <div className="notice-text">
        <p>
          <b>Blockr was updated to {version}.</b> What&rsquo;s new:
        </p>
        <ul>
          {notes.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </div>
      <div className="notice-actions">
        <button
          type="button"
          className="pill pill-light"
          onClick={() => {
            setVisible(false)
            chrome.storage.local.set({ [DISMISSED_KEY]: version })
          }}
        >
          got it
        </button>
      </div>
    </div>
  )
}
