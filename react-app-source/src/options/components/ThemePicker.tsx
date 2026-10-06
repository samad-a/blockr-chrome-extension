import { THEMES } from '../../shared/theme'
import type { Theme } from '../../shared/theme'

const LABELS: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' }

type ThemePickerProps = {
  theme: Theme
  onChange: (theme: Theme) => void
}

export function ThemePicker({ theme, onChange }: ThemePickerProps) {
  return (
    <fieldset className="segmented">
      <legend className="visually-hidden">Colour theme</legend>
      {THEMES.map((option) => (
        <label key={option} className={option === theme ? 'segment selected' : 'segment'}>
          <input
            type="radio"
            name="theme"
            value={option}
            checked={option === theme}
            onChange={() => onChange(option)}
          />
          {LABELS[option]}
        </label>
      ))}
    </fieldset>
  )
}
