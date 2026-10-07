import { useEffect, useState } from 'react'
import { openExtensionSettings, useIncognitoAllowed } from '../../shared/useIncognitoAllowed'

const DISMISSED_KEY = 'incognitoNoticeDismissed'

/** Dismissible banner shown while Blockr isn't allowed in private windows. */
export function PrivateWindowsNotice() {
  const allowed = useIncognitoAllowed()
  const [dismissed, setDismissed] = useState(true) // hidden until we've read the saved choice

  useEffect(() => {
    chrome.storage.local.get({ [DISMISSED_KEY]: false }).then((stored) => setDismissed(stored[DISMISSED_KEY] === true))
  }, [])

  if (allowed !== false || dismissed) return null

  return (
    <div className="notice" role="note">
      <p>
        <b>Blockr is off in private windows.</b> Blocked sites will open normally there. To fix that, turn on
        &ldquo;Allow in Incognito&rdquo; for Blockr.
      </p>
      <div className="notice-actions">
        <button type="button" className="pill" onClick={openExtensionSettings}>
          open settings
        </button>
        <button
          type="button"
          className="pill pill-light"
          onClick={() => {
            setDismissed(true)
            chrome.storage.local.set({ [DISMISSED_KEY]: true })
          }}
        >
          not now
        </button>
      </div>
    </div>
  )
}
