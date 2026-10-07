import { WELCOME_PATH } from '../../shared/welcome'

const PRIVACY_URL = 'https://github.com/samad-a/blockr-chrome-extension/blob/main/PRIVACY.md'
const ISSUES_URL = 'https://github.com/samad-a/blockr-chrome-extension/issues'

export function AboutSettings() {
  const { version } = chrome.runtime.getManifest()

  return (
    <section className="settings-section">
      <h3>About Blockr</h3>
      <p className="settings-help">Version {version}</p>
      <div className="password-actions">
        <button
          type="button"
          className="pill pill-light"
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL(WELCOME_PATH) })}
        >
          show welcome page
        </button>
        <a className="pill pill-light" href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
          privacy policy
        </a>
        <a className="pill pill-light" href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
          report a problem
        </a>
      </div>
    </section>
  )
}
