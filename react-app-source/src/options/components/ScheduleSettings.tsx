import { DAY_NAMES, DAY_SHORT, describeSchedule, minutesToTime, timeToMinutes } from '../../shared/schedule'
import type { Schedule } from '../../shared/schedule'
import { Switch } from '../../shared/Switch'

type ScheduleSettingsProps = {
  schedule: Schedule
  onChange: (schedule: Schedule) => void
}

// Week starts on Monday in the picker; stored days still use Date.getDay() (0 = Sunday).
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function ScheduleSettings({ schedule, onChange }: ScheduleSettingsProps) {
  const noDays = !schedule.days.some(Boolean)

  const toggleDay = (day: number) =>
    onChange({ ...schedule, days: schedule.days.map((on, i) => (i === day ? !on : on)) })

  const setTime = (field: 'start' | 'end', text: string) => {
    const minutes = timeToMinutes(text)
    if (minutes !== null) onChange({ ...schedule, [field]: minutes })
  }

  return (
    <section className="settings-section">
      <h3>Block schedule</h3>
      <p className="settings-help">
        Only block during set times, for example work hours. Outside them, nothing is blocked.
      </p>

      <div className="schedule-toggle">
        <Switch
          small
          label="Only block during set times"
          checked={schedule.enabled}
          onChange={(enabled) => onChange({ ...schedule, enabled })}
        />
        <span>{schedule.enabled ? 'Schedule on' : 'Always block'}</span>
      </div>

      {schedule.enabled && (
        <div className="schedule-body">
          <div className="day-picker" role="group" aria-label="Days">
            {DISPLAY_ORDER.map((day) => (
              <button
                key={day}
                type="button"
                className={schedule.days[day] ? 'day selected' : 'day'}
                aria-pressed={schedule.days[day]}
                aria-label={DAY_NAMES[day]}
                onClick={() => toggleDay(day)}
              >
                {DAY_SHORT[day]}
              </button>
            ))}
          </div>

          <div className="time-range">
            <label>
              from
              <input
                className="text-input"
                type="time"
                value={minutesToTime(schedule.start)}
                onChange={(e) => setTime('start', e.target.value)}
              />
            </label>
            <label>
              to
              <input
                className="text-input"
                type="time"
                value={minutesToTime(schedule.end)}
                onChange={(e) => setTime('end', e.target.value)}
              />
            </label>
          </div>

          <p className="settings-message" role={noDays ? 'alert' : 'status'}>
            {noDays
              ? 'Pick at least one day, or nothing will be blocked.'
              : `Blocking ${describeSchedule(schedule)}.`}
          </p>
        </div>
      )}
    </section>
  )
}
