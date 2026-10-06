import { useCallback, useEffect, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'

export const THEMES: Theme[] = ['system', 'light', 'dark']

const KEY = 'theme'

export async function loadTheme(): Promise<Theme> {
  const stored = (await chrome.storage.sync.get({ [KEY]: 'system' }))[KEY] as Theme
  return THEMES.includes(stored) ? stored : 'system'
}

/** "system" removes the attribute so the CSS prefers-color-scheme rule decides. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement) {
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

/** Applies the saved theme to the page and keeps it in sync with other extension pages. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    let active = true
    const refresh = () =>
      loadTheme().then((t) => {
        if (!active) return
        setThemeState(t)
        applyTheme(t)
      })
    refresh()
    const onChanged = (changes: Record<string, unknown>, area: string) => {
      if (area === 'sync' && KEY in changes) refresh()
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      active = false
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    chrome.storage.sync.set({ [KEY]: next })
  }, [])

  return { theme, setTheme }
}
