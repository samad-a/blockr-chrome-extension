import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SCHEDULE, SCHEDULE_KEY, loadSchedule } from './schedule'
import type { Schedule } from './schedule'

/** Live block schedule from chrome.storage.sync. `loaded` is false until the first read. */
export function useSchedule() {
  const [schedule, setScheduleState] = useState<Schedule>(DEFAULT_SCHEDULE)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    const refresh = () =>
      loadSchedule().then((value) => {
        if (!active) return
        setScheduleState(value)
        setLoaded(true)
      })
    refresh()
    const onChanged = (changes: Record<string, unknown>, area: string) => {
      if (area === 'sync' && SCHEDULE_KEY in changes) refresh()
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      active = false
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  const setSchedule = useCallback((next: Schedule) => {
    setScheduleState(next)
    chrome.storage.sync.set({ [SCHEDULE_KEY]: next })
  }, [])

  return { schedule, setSchedule, loaded }
}
