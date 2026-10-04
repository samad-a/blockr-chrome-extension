// Service worker: runs in the background, no UI.
// This is where the blocking logic (declarativeNetRequest rules) will go.

chrome.runtime.onInstalled.addListener(() => {
  console.log('Blockr installed')
})
