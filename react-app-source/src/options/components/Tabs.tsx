import type { KeyboardEvent } from 'react'

export type TabDef<T extends string> = { id: T; label: string }

type TabsProps<T extends string> = {
  tabs: TabDef<T>[]
  active: T
  onChange: (id: T) => void
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  // Arrow keys move between tabs, as the ARIA tabs pattern expects.
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    const next = tabs[(index + step + tabs.length) % tabs.length]
    onChange(next.id)
    document.getElementById(`tab-${next.id}`)?.focus()
  }

  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          aria-controls="tab-panel"
          tabIndex={tab.id === active ? 0 : -1}
          className={tab.id === active ? 'tab active' : 'tab'}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
