import { useEffect, useState } from 'react'
import { DEFAULT_LOCAL, loadLocal } from './local'
import type { LocalState } from './local'

/** Live view of chrome.storage.local. `loaded` is false until the first read finishes. */
export function useLocalState(): LocalState & { loaded: boolean } {
  const [state, setState] = useState<LocalState & { loaded: boolean }>({ ...DEFAULT_LOCAL, loaded: false })

  useEffect(() => {
    let active = true
    const refresh = () =>
      loadLocal().then((s) => {
        if (active) setState({ ...s, loaded: true })
      })
    refresh()
    const onChanged = (_changes: unknown, area: string) => {
      if (area === 'local') refresh()
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      active = false
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  return state
}
