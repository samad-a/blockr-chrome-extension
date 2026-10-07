import type { Theme } from '../../shared/theme'
import type { Schedule } from '../../shared/schedule'
import { PasswordSettings } from './PasswordSettings'
import { ScheduleSettings } from './ScheduleSettings'
import { ThemePicker } from './ThemePicker'

type SettingsPanelProps = {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  hasPassword: boolean
  schedule: Schedule
  onScheduleChange: (schedule: Schedule) => void
}

export function SettingsPanel({ theme, onThemeChange, hasPassword, schedule, onScheduleChange }: SettingsPanelProps) {
  return (
    <div className="settings">
      <section className="settings-section">
        <h3>Appearance</h3>
        <p className="settings-help">
          &ldquo;System&rdquo; follows your device&rsquo;s light or dark setting. This applies to the popup and blocked
          page too.
        </p>
        <ThemePicker theme={theme} onChange={onThemeChange} />
      </section>
      <ScheduleSettings schedule={schedule} onChange={onScheduleChange} />
      <PasswordSettings hasPassword={hasPassword} />
    </div>
  )
}
