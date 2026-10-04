import { useCallback, useEffect, useRef, useState } from 'react'
import { ALL_PRESETS } from './presets'
import type { BlockListState } from './types'

export const DEFAULT_STATE: BlockListState = {
  customSites: [],
  presetEnabled: {},
  categories: { social: false, shortForm: false },
}

export async function loadState(): Promise<BlockListState> {
  // Passing the defaults makes get() fill in any missing keys.
  return (await chrome.storage.sync.get(DEFAULT_STATE)) as BlockListState
}

/** Number of distinct URLs that are currently enabled. */
export function countBlocked(state: BlockListState): number {
  const urls = new Set<string>()
  for (const site of state.customSites) {
    if (site.enabled) urls.add(site.url)
  }
  for (const preset of ALL_PRESETS) {
    if (state.categories[preset.category] && state.presetEnabled[preset.id]) urls.add(preset.url)
  }
  return urls.size
}

/**
 * Loads the block list, keeps it in sync with other extension pages,
 * and writes every change through to chrome.storage.sync.
 */
export function useBlockList() {
  const [state, setState] = useState<BlockListState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latest = useRef<BlockListState | null>(null)

  useEffect(() => {
    let active = true
    const refresh = () =>
      loadState().then((s) => {
        if (!active) return
        latest.current = s
        setState(s)
      })
    refresh()
    const onChanged = (_changes: unknown, area: string) => {
      if (area === 'sync') refresh()
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      active = false
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  const update = useCallback((change: (s: BlockListState) => BlockListState) => {
    if (!latest.current) return
    const next = change(latest.current)
    latest.current = next
    setState(next)
    setError(null)
    chrome.storage.sync.set(next).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Could not save your changes.')
    })
  }, [])

  return { state, update, error }
}
