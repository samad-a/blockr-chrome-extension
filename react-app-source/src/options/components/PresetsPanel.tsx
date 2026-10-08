import { isPresetEnabled } from '../../shared/blocking'
import { PRESETS_BY_CATEGORY } from '../../shared/presets'
import { Switch } from '../../shared/Switch'
import type { BlockListState, Category } from '../../shared/types'
import { SiteTable } from './SiteTable'

const CATEGORIES: { id: Category; title: string; blocking: string; listed: boolean }[] = [
  { id: 'social', title: 'Social media', blocking: 'social media', listed: true },
  { id: 'shortForm', title: 'Short-form content', blocking: 'short-form content', listed: true },
  // Adult content is a single switch: its sites aren't listed on the page.
  { id: 'adult', title: 'Adult content', blocking: 'adult content', listed: false },
]

type PresetsPanelProps = {
  state: BlockListState
  blockCounts: Record<string, number>
  update: (change: (state: BlockListState) => BlockListState) => void
}

/** Built-in sites, one section per category. Each has a master switch; most also list per-site switches. */
export function PresetsPanel({ state, blockCounts, update }: PresetsPanelProps) {
  return (
    <div className="presets">
      {CATEGORIES.map(({ id, title, blocking, listed }) => (
        <section key={id} className="preset-section" aria-labelledby={`presets-${id}`}>
          <h3 id={`presets-${id}`}>{title}</h3>
          <div className="master">
            <Switch
              small
              label={`Block ${blocking}`}
              checked={state.categories[id]}
              onChange={(on) => update((s) => ({ ...s, categories: { ...s.categories, [id]: on } }))}
            />
            <p>
              {listed
                ? state.categories[id]
                  ? `Blocking ${blocking} (the sites switched on below).`
                  : `Turn this on to block the sites switched on below.`
                : state.categories[id]
                  ? `Blocking ${blocking}.`
                  : `Turn this on to block ${blocking}.`}
            </p>
          </div>
          {listed && (
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
          )}
        </section>
      ))}
    </div>
  )
}
