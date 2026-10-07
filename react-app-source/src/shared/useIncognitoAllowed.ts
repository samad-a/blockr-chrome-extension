import { useEffect, useState } from 'react'

/**
 * Whether the user has switched on "Allow in Incognito" for Blockr.
 * Extensions can't turn it on themselves, so the best we can do is notice, and
 * link to the settings page. Re-checks when the user comes back to this tab.
 * Returns null until the first check finishes.
 */
export function useIncognitoAllowed(): boolean | null {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    const check = () =>
      chrome.extension
        .isAllowedIncognitoAccess()
        .then((value) => active && setAllowed(value))
        .catch(() => {})
    check()
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      active = false
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  return allowed
}

/** Opens Blockr's page on chrome://extensions, where the "Allow in Incognito" switch is. */
export function openExtensionSettings() {
  chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` })
}
