import { openExtensionSettings, useIncognitoAllowed } from '../../shared/useIncognitoAllowed'

/** Settings section showing whether Blockr works in private windows. */
export function PrivateWindowsSettings() {
  const allowed = useIncognitoAllowed()
  if (allowed === null) return null

  return (
    <section className="settings-section">
      <h3>Private windows</h3>
      <p className="settings-help">
        {allowed
          ? 'Blockr is on in private windows, so blocked sites are blocked there too.'
          : 'Blockr is off in private windows, so blocked sites open normally there. Chrome only lets you turn this on yourself: switch on “Allow in Incognito” for Blockr.'}
      </p>
      {!allowed && (
        <button type="button" className="pill" onClick={openExtensionSettings}>
          open extension settings
        </button>
      )}
    </section>
  )
}
