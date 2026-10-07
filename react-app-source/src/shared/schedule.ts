// Block schedule: when enabled, blocking only applies on chosen days between two times.
// Pure logic (no browser APIs) so it's easy to test; storage is at the bottom.

export type Schedule = {
  enabled: boolean
  /** Index 0 = Sunday ... 6 = Saturday (same as Date.getDay()). */
  days: boolean[]
  /** Minutes after midnight. If end <= start the window runs overnight into the next day. */
  start: number
  end: number
}

export const SCHEDULE_KEY = 'schedule'

export const DEFAULT_SCHEDULE: Schedule = {
  enabled: false,
  days: [false, true, true, true, true, true, false],
  start: 9 * 60,
  end: 17 * 60,
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const isMinutes = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 24 * 60

/** Accepts whatever is in storage and returns a valid schedule. */
export function normalizeSchedule(raw: unknown): Schedule {
  const value = (raw ?? {}) as Partial<Schedule>
  const days =
    Array.isArray(value.days) && value.days.length === 7
      ? value.days.map(Boolean)
      : DEFAULT_SCHEDULE.days
  return {
    enabled: value.enabled === true,
    days,
    start: isMinutes(value.start) ? value.start : DEFAULT_SCHEDULE.start,
    end: isMinutes(value.end) ? value.end : DEFAULT_SCHEDULE.end,
  }
}

/** Is blocking switched on at `date`? Always true when the schedule is off. */
export function isBlockingNow(schedule: Schedule, date: Date = new Date()): boolean {
  if (!schedule.enabled) return true
  const minutes = date.getHours() * 60 + date.getMinutes()
  const today = date.getDay()
  const yesterday = (today + 6) % 7
  const { start, end, days } = schedule

  if (start === end) return days[today] // all day on the chosen days
  if (start < end) return days[today] && minutes >= start && minutes < end
  // Overnight window (e.g. 22:00 - 06:00): evening of a chosen day, or the morning after one.
  return (days[today] && minutes >= start) || (days[yesterday] && minutes < end)
}

/** The next moment blocking turns on or off, or null if it never changes. */
export function nextChange(schedule: Schedule, date: Date = new Date()): Date | null {
  if (!schedule.enabled) return null
  const current = isBlockingNow(schedule, date)
  const times = [...new Set([0, schedule.start, schedule.end])].sort((a, b) => a - b)

  for (let offset = 0; offset <= 8; offset++) {
    for (const minutes of times) {
      const candidate = new Date(date)
      candidate.setDate(candidate.getDate() + offset)
      candidate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
      if (candidate.getTime() > date.getTime() && isBlockingNow(schedule, candidate) !== current) {
        return candidate
      }
    }
  }
  return null
}

export const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** "09:30" -> 570, or null if it isn't a valid time. */
export function timeToMinutes(text: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text)
  if (!match) return null
  const minutes = Number(match[1]) * 60 + Number(match[2])
  return isMinutes(minutes) && Number(match[2]) < 60 ? minutes : null
}

const clock = (date: Date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export function formatMinutes(minutes: number): string {
  const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60)
  return clock(date)
}

/** "9:00 AM" if it's today, otherwise "Mon 9:00 AM". */
export function describeMoment(moment: Date, now: Date = new Date()): string {
  const sameDay = moment.toDateString() === now.toDateString()
  return sameDay ? clock(moment) : `${DAY_SHORT[moment.getDay()]} ${clock(moment)}`
}

/** Short popup text while the schedule has blocking off, or null if blocking is on. */
export function scheduleOffText(schedule: Schedule, now: Date = new Date()): string | null {
  if (isBlockingNow(schedule, now)) return null
  const next = nextChange(schedule, now)
  return next ? `off until ${describeMoment(next, now)}` : 'off (no days selected)'
}

/** "Mon, Tue, Wed" -> "Mon–Wed" style summary of the chosen days. */
export function describeDays(days: boolean[]): string {
  const chosen = days.map((on, i) => (on ? i : -1)).filter((i) => i >= 0)
  if (chosen.length === 0) return 'no days'
  if (chosen.length === 7) return 'every day'
  const consecutive = chosen.every((day, i) => i === 0 || day === chosen[i - 1] + 1)
  if (consecutive && chosen.length > 2) return `${DAY_SHORT[chosen[0]]}–${DAY_SHORT[chosen[chosen.length - 1]]}`
  return chosen.map((i) => DAY_SHORT[i]).join(', ')
}

export function describeSchedule(schedule: Schedule): string {
  const days = describeDays(schedule.days)
  if (schedule.start === schedule.end) return `${days}, all day`
  const overnight = schedule.end < schedule.start ? ' (ends the next day)' : ''
  return `${days}, ${formatMinutes(schedule.start)} – ${formatMinutes(schedule.end)}${overnight}`
}

export async function loadSchedule(): Promise<Schedule> {
  const stored = await chrome.storage.sync.get({ [SCHEDULE_KEY]: DEFAULT_SCHEDULE })
  return normalizeSchedule(stored[SCHEDULE_KEY])
}
