import { useEffect } from 'react'
import blockrIcon from '../assets/blockr-icon.svg'
import { incrementBlockCount } from '../shared/local'
import './blocked.css'

const params = new URLSearchParams(window.location.search)
const site = params.get('site') ?? 'This site'
const url = params.get('url')

// StrictMode runs effects twice in dev; make sure one visit counts once.
let counted = false

async function goBack() {
  if (window.history.length > 1) {
    window.history.back()
    return
  }
  // Opened directly in a fresh tab: nothing to go back to, so close it.
  const tab = await chrome.tabs.getCurrent()
  if (tab?.id !== undefined) chrome.tabs.remove(tab.id)
}

export default function BlockedApp() {
  useEffect(() => {
    if (counted || !url) return
    counted = true
    incrementBlockCount(url)
  }, [])

  return (
    <main className="blocked">
      <div className="brand">
        <img src={blockrIcon} alt="" />
        <h1>Blockr</h1>
      </div>
      <h2>{site} is blocked</h2>
      <p>This site is on your block list. Stay focused &mdash; you&rsquo;ve got this.</p>
      <button type="button" onClick={goBack}>
        go back
      </button>
    </main>
  )
}
