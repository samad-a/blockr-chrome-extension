import type { Theme } from '../../shared/theme'
import type { CustomSite } from '../../shared/types'
import { AboutSettings } from './AboutSettings'
import { BackupSettings } from './BackupSettings'
import { PrivateWindowsSettings } from './PrivateWindowsSettings'
import { ThemePicker } from './ThemePicker'

type SettingsPanelProps = {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  customSites: CustomSite[]
  onCustomSitesChange: (sites: CustomSite[]) => void
}

export function SettingsPanel({ theme, onThemeChange, customSites, onCustomSitesChange }: SettingsPanelProps) {
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
      <BackupSettings sites={customSites} onSitesChange={onCustomSitesChange} />
      <PrivateWindowsSettings />
      <AboutSettings />
    </div>
  )
}
