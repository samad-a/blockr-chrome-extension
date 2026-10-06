import type { Theme } from '../../shared/theme'
import { PasswordSettings } from './PasswordSettings'
import { ThemePicker } from './ThemePicker'

type SettingsPanelProps = {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  hasPassword: boolean
}

export function SettingsPanel({ theme, onThemeChange, hasPassword }: SettingsPanelProps) {
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
      <PasswordSettings hasPassword={hasPassword} />
    </div>
  )
}
