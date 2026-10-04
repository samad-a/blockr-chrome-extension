// Device-local state (chrome.storage.local). Kept out of sync storage because
// counters change often and sync is limited to 120 writes per minute.

/** `until: null` means paused until the user resumes. */
export type Pause = { until: number | null } | null

export type LocalState = {
  /** Normalised block URL -> number of times the blocked page was shown. */
  blockCounts: Record<string, number>
  pause: Pause
}

export const DEFAULT_LOCAL: LocalState = { blockCounts: {}, pause: null }

export async function loadLocal(): Promise<LocalState> {
  return (await chrome.storage.local.get(DEFAULT_LOCAL)) as LocalState
}

export function isPaused(pause: Pause, now = Date.now()): boolean {
  return pause !== null && (pause.until === null || pause.until > now)
}

export async function incrementBlockCount(url: string): Promise<void> {
  const { blockCounts } = await loadLocal()
  await chrome.storage.local.set({ blockCounts: { ...blockCounts, [url]: (blockCounts[url] ?? 0) + 1 } })
}

export async function setPause(pause: Pause): Promise<void> {
  await chrome.storage.local.set({ pause })
}
