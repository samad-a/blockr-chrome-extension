import { useEffect, useState } from 'react'
import { DEFAULT_LOCAL, loadLocal } from './local'
import type { LocalState } from './local'

/** Live view of chrome.storage.local (block counters, pause). */
export function useLocalState(): LocalState {
  const [state, setState] = useState<LocalState>(DEFAULT_LOCAL)

  useEffect(() => {
    let active = true
    const refresh = () =>
      loadLocal().then((s) => {
        if (active) setState(s)
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
