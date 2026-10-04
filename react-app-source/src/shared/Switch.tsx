import './theme.css'
import './Switch.css'

type SwitchProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  small?: boolean
}

export function Switch({ label, checked, onChange, small }: SwitchProps) {
  return (
    <label className={small ? 'switch small' : 'switch'}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className="slider round"></span>
    </label>
  )
}
