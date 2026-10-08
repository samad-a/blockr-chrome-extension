import { useEffect, useRef, useState } from 'react'
import blockrIcon from '../../assets/blockr-icon.svg'

export type SectionDef<T extends string> = { id: T; label: string; group?: 'control' }

type SidebarProps<T extends string> = {
  sections: SectionDef<T>[]
  active: T
  onChange: (id: T) => void
  donateUrl: string
}

/**
 * Section navigation: a card on the left on wide screens, a "menu" button under the
 * logo on narrow ones. Items are plain buttons, so Tab reaches each one.
 */
export function Sidebar<T extends string>({ sections, active, onChange, donateUrl }: SidebarProps<T>) {
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  // Escape closes the narrow-screen menu and puts focus back on its button.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      menuButton.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const choose = (id: T) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <aside className={open ? 'sidebar open' : 'sidebar'}>
      <div className="sidebar-top">
        <div className="brand">
          <img src={blockrIcon} alt="" />
          <p className="brand-name">Blockr</p>
        </div>
        <button
          ref={menuButton}
          type="button"
          className="pill pill-light menu-button"
          aria-expanded={open}
          aria-controls="section-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? 'close' : 'menu'}
        </button>
      </div>

      <nav id="section-nav" className="section-nav" aria-label="Sections">
        {sections.map((section, i) => (
          <div key={section.id} className="nav-entry">
            {section.group === 'control' && sections[i - 1]?.group !== 'control' && (
              <p className="nav-group" aria-hidden="true">
                control
              </p>
            )}
            <button
              type="button"
              className={section.id === active ? 'nav-item active' : 'nav-item'}
              aria-current={section.id === active ? 'page' : undefined}
              onClick={() => choose(section.id)}
            >
              {section.label}
            </button>
          </div>
        ))}
      </nav>

      <div className="donate">
        <span>help keep this extension free</span>
        <a className="pill" href={donateUrl} target="_blank" rel="noopener noreferrer">
          donate
        </a>
      </div>
    </aside>
  )
}
