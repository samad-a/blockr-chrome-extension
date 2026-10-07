import blockrIcon from '../assets/blockr-icon.svg'
import { Switch } from '../shared/Switch'
import { useTheme } from '../shared/theme'
import { useBlockList } from '../shared/useBlockList'
import { openExtensionSettings, useIncognitoAllowed } from '../shared/useIncognitoAllowed'
import type { Category } from '../shared/types'
import './welcome.css'

const openOptions = (hash = '') => chrome.tabs.create({ url: chrome.runtime.getURL(`options.html${hash}`) })

/** Shown once, in its own tab, after a first install. Everything on it is optional. */
export default function WelcomeApp() {
  useTheme()
  const { state, update } = useBlockList()
  const incognitoAllowed = useIncognitoAllowed()

  if (!state) return null

  const setCategory = (category: Category) => (on: boolean) =>
    update((s) => ({ ...s, categories: { ...s.categories, [category]: on } }))

  const close = async () => {
    const tab = await chrome.tabs.getCurrent()
    if (tab?.id !== undefined) chrome.tabs.remove(tab.id)
    else window.close()
  }

  return (
    <main className="welcome">
      <div className="brand">
        <img src={blockrIcon} alt="" />
        <h1>Blockr</h1>
      </div>
      <h2>Welcome</h2>
      <p className="lead">
        Blockr blocks the websites that pull you off task. Nothing here is required, and you can change everything
        later from the Blockr icon in your toolbar.
      </p>

      <section className="step">
        <h3>1. Choose what to block</h3>
        <div className="choice">
          <Switch
            small
            label="Block social media"
            checked={state.categories.social}
            onChange={setCategory('social')}
          />
          <span>Block social media</span>
          <small>Instagram, TikTok, X, Facebook, Reddit, Snapchat, Threads</small>
        </div>
        <div className="choice">
          <Switch
            small
            label="Block short-form content"
            checked={state.categories.shortForm}
            onChange={setCategory('shortForm')}
          />
          <span>Block short-form content</span>
          <small>YouTube Shorts, TikTok, Instagram and Facebook Reels, Snapchat Spotlight</small>
        </div>
        <p className="hint">
          Want to block something else?{' '}
          <button type="button" className="link-button" onClick={() => openOptions()}>
            Add your own sites
          </button>
          .
        </p>
      </section>

      <section className="step">
        <h3>2. Make it stick (optional)</h3>
        <p className="hint">
          Only block during work hours, give a site a daily time limit, or protect your list with a password.{' '}
          <button type="button" className="link-button" onClick={() => openOptions('#settings')}>
            Open settings
          </button>
        </p>
      </section>

      {incognitoAllowed === false && (
        <section className="step">
          <h3>3. Private windows</h3>
          <p className="hint">
            Blockr is off in private windows until you turn on &ldquo;Allow in Incognito&rdquo; for it. Only you can do
            that, and it&rsquo;s optional.{' '}
            <button type="button" className="link-button" onClick={openExtensionSettings}>
              Open extension settings
            </button>
          </p>
        </section>
      )}

      <div className="done">
        <button type="button" className="pill" onClick={close}>
          done
        </button>
      </div>
    </main>
  )
}
