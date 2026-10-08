import { useState } from 'react'
import { isPresetEnabled } from '../../shared/blocking'
import { PRESETS_BY_CATEGORY } from '../../shared/presets'
import { Switch } from '../../shared/Switch'
import type { BlockListState, Category } from '../../shared/types'
import { Favicon } from './Favicon'
import { SiteTable } from './SiteTable'

const CATEGORIES: { id: Category; title: string; blocking: string; listed: boolean }[] = [
  { id: 'social', title: 'Social media', blocking: 'social media', listed: true },
  { id: 'shortForm', title: 'Short-form content', blocking: 'short-form content', listed: true },
  // Adult content is a single switch: its sites aren't listed or shown on the page.
  { id: 'adult', title: 'Adult content', blocking: 'adult content', listed: false },
]

type PresetsPanelProps = {
  state: BlockListState
  blockCounts: Record<string, number>
  update: (change: (state: BlockListState) => BlockListState) => void
}

const Chevron = () => (
  <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/**
 * Built-in sites, one block per category. A block shows the icons of the sites it blocks;
 * opening it lists them so each can be switched on or off. Only one block is open at a
 * time, so the page never grows taller than the window.
 */
export function PresetsPanel({ state, blockCounts, update }: PresetsPanelProps) {
  const [open, setOpen] = useState<Category | null>(null)

  return (
    <div className="presets">
      <p className="settings-help presets-hint">
        Switch a whole category on or off here. Open one to see its sites and turn individual ones off.
      </p>

      {CATEGORIES.map(({ id, title, blocking, listed }) => {
        const on = state.categories[id]
        const isOpen = open === id
        const active = PRESETS_BY_CATEGORY[id].filter((p) => isPresetEnabled(state, p.id))
        const bodyId = `presets-body-${id}`

        return (
          <section key={id} className={isOpen ? 'preset-block open' : 'preset-block'}>
            <div className="preset-head">
              {listed ? (
                <h3 className="preset-title">
                  <button
                    type="button"
                    className="preset-toggle"
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    onClick={() => setOpen(isOpen ? null : id)}
                  >
                    <span className="preset-name">
                      {title}
                      <small>
                        {on
                          ? active.length === 0
                            ? 'No sites switched on'
                            : `Blocking ${active.length} ${active.length === 1 ? 'site' : 'sites'}`
                          : 'Off'}
                      </small>
                    </span>
                    <span className={on ? 'preset-icons' : 'preset-icons dimmed'}>
                      {active.map((p) => (
                        <Favicon key={p.id} url={p.urls[0]} />
                      ))}
                    </span>
                    <span className="visually-hidden">{active.map((p) => p.name).join(', ')}.</span>
                    <span className="preset-edit">
                      {isOpen ? 'hide sites' : 'show sites'}
                      <Chevron />
                    </span>
                  </button>
                </h3>
              ) : (
                <h3 className="preset-title">
                  <span className="preset-name">
                    {title}
                    <small>{on ? 'On' : 'Off'}</small>
                  </span>
                </h3>
              )}
              <Switch
                small
                label={`Block ${blocking}`}
                checked={on}
                onChange={(next) => update((s) => ({ ...s, categories: { ...s.categories, [id]: next } }))}
              />
            </div>

            {listed && isOpen && (
              <div id={bodyId} className="preset-body">
                <SiteTable
                  rows={PRESETS_BY_CATEGORY[id].map((p) => ({
                    id: p.id,
                    name: p.name,
                    url: p.urls[0],
                    urlLabel: p.urls.join(', '),
                    timesBlocked: p.urls.reduce((total, url) => total + (blockCounts[url] ?? 0), 0),
                    enabled: isPresetEnabled(state, p.id),
                    editable: false,
                  }))}
                  onToggle={(presetId, enabled) =>
                    update((s) => ({ ...s, presetEnabled: { ...s.presetEnabled, [presetId]: enabled } }))
                  }
                />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
