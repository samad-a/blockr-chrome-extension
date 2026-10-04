import { useCallback, useEffect, useRef, useState } from 'react'
import { loadState } from './storage'
import type { BlockListState } from './types'

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
