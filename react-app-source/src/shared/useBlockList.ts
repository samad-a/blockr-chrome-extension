import { useCallback, useEffect, useRef, useState } from 'react'
import { loadStateWithStatus, saveState } from './storage'
import type { BlockListState } from './types'

/**
 * Loads the block list, keeps it in sync with other extension pages,
 * and writes every change through to chrome.storage.sync (only what changed).
 */
export function useBlockList() {
  const [state, setState] = useState<BlockListState | null>(null)
  const [readOnly, setReadOnly] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const latest = useRef<BlockListState | null>(null)
  const isReadOnly = useRef(false)
  const refreshRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    let active = true
    const refresh = () =>
      loadStateWithStatus().then(({ state: loaded, readOnly: newer }) => {
        if (!active) return
        latest.current = loaded
        isReadOnly.current = newer
        setState(loaded)
        setReadOnly(newer)
      })
    refreshRef.current = refresh
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
    const previous = latest.current
    if (!previous) return
    if (isReadOnly.current) {
      setError('This list was saved by a newer version of Blockr. Update Blockr to change it.')
      return
    }
    const next = change(previous)
    latest.current = next
    setState(next)
    setError(null)
    saveState(previous, next).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Could not save your changes.')
      // Show what is actually stored, not the change that didn't save.
      refreshRef.current()
    })
  }, [])

  return { state, update, error, readOnly }
}
