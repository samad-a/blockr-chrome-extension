import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SCHEDULE,
  describeDays,
  isBlockingNow,
  minutesToTime,
  nextChange,
  normalizeSchedule,
  scheduleOffText,
  timeToMinutes,
} from './schedule'
import type { Schedule } from './schedule'

// 2026-10-05 is a Monday. Local-time dates, as the code uses local time.
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, 4 + day, hours, minutes)
const SUN = 0
const MON = 1
const FRI = 5
const SAT = 6

const workdays: Schedule = { ...DEFAULT_SCHEDULE, enabled: true } // Mon-Fri 9:00-17:00

describe('isBlockingNow', () => {
  it('is always on when the schedule is off', () => {
    expect(isBlockingNow({ ...workdays, enabled: false }, at(SAT, 3))).toBe(true)
  })

  it('blocks only inside the window on chosen days', () => {
    expect(isBlockingNow(workdays, at(MON, 9, 0))).toBe(true)
    expect(isBlockingNow(workdays, at(MON, 16, 59))).toBe(true)
    expect(isBlockingNow(workdays, at(MON, 17, 0))).toBe(false)
    expect(isBlockingNow(workdays, at(MON, 8, 59))).toBe(false)
    expect(isBlockingNow(workdays, at(SAT, 12))).toBe(false)
  })

  it('handles an overnight window', () => {
    const night: Schedule = { enabled: true, days: [false, true, false, false, false, false, false], start: 22 * 60, end: 6 * 60 }
    expect(isBlockingNow(night, at(MON, 23))).toBe(true) // Monday evening
    expect(isBlockingNow(night, at(MON + 1, 5, 59))).toBe(true) // ...until Tuesday 06:00
    expect(isBlockingNow(night, at(MON + 1, 6, 0))).toBe(false)
    expect(isBlockingNow(night, at(MON, 5))).toBe(false) // Monday morning isn't covered
    expect(isBlockingNow(night, at(MON + 1, 23))).toBe(false) // Tuesday evening isn't chosen
  })

  it('treats equal start and end as all day on the chosen days', () => {
    const allDay: Schedule = { ...workdays, start: 0, end: 0 }
    expect(isBlockingNow(allDay, at(MON, 3))).toBe(true)
    expect(isBlockingNow(allDay, at(SAT, 12))).toBe(false)
  })

  it('never blocks when no days are chosen', () => {
    expect(isBlockingNow({ ...workdays, days: Array(7).fill(false) }, at(MON, 10))).toBe(false)
  })
})

describe('nextChange', () => {
  it('is null when the schedule is off or never changes', () => {
    expect(nextChange({ ...workdays, enabled: false }, at(MON, 10))).toBeNull()
    expect(nextChange({ ...workdays, days: Array(7).fill(false) }, at(MON, 10))).toBeNull()
  })

  it('finds the end of the current window', () => {
    expect(nextChange(workdays, at(MON, 10))).toEqual(at(MON, 17))
  })

  it('finds the next start, skipping the weekend', () => {
    expect(nextChange(workdays, at(FRI, 18))).toEqual(at(FRI + 3, 9)) // Friday evening -> Monday 9:00
    expect(nextChange(workdays, at(SUN, 12))).toEqual(at(MON, 9))
  })

  it('finds the end of an overnight window the next morning', () => {
    const night: Schedule = { enabled: true, days: [false, true, false, false, false, false, false], start: 22 * 60, end: 6 * 60 }
    expect(nextChange(night, at(MON, 23))).toEqual(at(MON + 1, 6))
  })
})

describe('scheduleOffText', () => {
  it('is null while blocking is on', () => {
    expect(scheduleOffText(workdays, at(MON, 10))).toBeNull()
  })

  it('says when blocking resumes', () => {
    const now = at(MON, 18)
    expect(scheduleOffText(workdays, now)).toMatch(/^off until Tue /)
    expect(scheduleOffText(workdays, at(MON, 7))).toMatch(/^off until /)
    expect(scheduleOffText(workdays, at(MON, 7))).not.toMatch(/Mon|Tue/)
  })

  it('explains the no-days case', () => {
    expect(scheduleOffText({ ...workdays, days: Array(7).fill(false) }, at(MON, 10))).toBe('off (no days selected)')
  })
})

describe('helpers', () => {
  it('converts times', () => {
    expect(minutesToTime(9 * 60 + 5)).toBe('09:05')
    expect(timeToMinutes('09:05')).toBe(545)
    expect(timeToMinutes('24:00')).toBeNull()
    expect(timeToMinutes('9:60')).toBeNull()
    expect(timeToMinutes('')).toBeNull()
  })

  it('summarises days', () => {
    expect(describeDays(DEFAULT_SCHEDULE.days)).toBe('Mon–Fri')
    expect(describeDays(Array(7).fill(true))).toBe('every day')
    expect(describeDays([true, false, false, false, false, false, true])).toBe('Sun, Sat')
    expect(describeDays(Array(7).fill(false))).toBe('no days')
  })

  it('repairs bad stored data', () => {
    expect(normalizeSchedule(undefined)).toEqual(DEFAULT_SCHEDULE)
    expect(normalizeSchedule({ enabled: true, days: [true], start: -5, end: 'x' })).toEqual({
      ...DEFAULT_SCHEDULE,
      enabled: true,
    })
  })
})
