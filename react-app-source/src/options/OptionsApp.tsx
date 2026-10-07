import { useState } from 'react'
import blockrIcon from '../assets/blockr-icon.svg'
import { isPresetEnabled } from '../shared/blocking'
import { PRESETS_BY_CATEGORY } from '../shared/presets'
import { Switch } from '../shared/Switch'
import { useLock } from '../shared/useLock'
import { useSchedule } from '../shared/useSchedule'
import { useTheme } from '../shared/theme'
import { useBlockList } from '../shared/useBlockList'
import { useLocalState } from '../shared/useLocalState'
import type { Category } from '../shared/types'
import { LockScreen } from './components/LockScreen'
import { SettingsPanel } from './components/SettingsPanel'
import { SiteTable } from './components/SiteTable'
import type { SiteRowData } from './components/SiteRow'
import { Tabs } from './components/Tabs'
import type { TabDef } from './components/Tabs'
import './options.css'

// Ko-fi page (opens in a new tab).
const DONATE_URL = 'https://ko-fi.com/samaddev'

type TabId = 'custom' | Category | 'settings'

const TABS: TabDef<TabId>[] = [
  { id: 'custom', label: 'Custom Block List' },
  { id: 'social', label: 'Social Media' },
  { id: 'shortForm', label: 'Short-Form Content' },
  { id: 'settings', label: 'Settings' },
]

const CATEGORY_LABEL: Record<Category, string> = {
  social: 'social media',
  shortForm: 'short-form content',
}

export default function OptionsApp() {
  const { state, update, error } = useBlockList()
  const { blockCounts } = useLocalState()
  const lock = useLock()
  const { theme, setTheme } = useTheme()
  const { schedule, setSchedule, loaded: scheduleLoaded } = useSchedule()
  const [tab, setTab] = useState<TabId>('custom')

  // Wait for storage (including the lock) so a locked page never flashes its contents.
  if (!state || !lock.ready || !scheduleLoaded) return null
  if (lock.locked) {
    return <LockScreen resetAt={lock.resetAt} lockedUntil={lock.lockedUntil} now={lock.now} />
  }

  const customRows: SiteRowData[] = state.customSites.map((s) => ({
    ...s,
    timesBlocked: blockCounts[s.url] ?? 0,
    editable: true,
  }))

  return (
    <main className="options">
      <header className="options-header">
        <div className="brand">
          <img src={blockrIcon} alt="" />
          <h1>Blockr</h1>
        </div>
        <div className="donate">
          <span>help keep this extension free -</span>
          <a className="pill" href={DONATE_URL} target="_blank" rel="noopener noreferrer">
            donate
          </a>
        </div>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <section className="card" id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {error && (
          <p className="banner" role="alert">
            Couldn&rsquo;t save: {error}
          </p>
        )}

        {tab === 'custom' ? (
          <SiteTable
            rows={customRows}
            onToggle={(id, enabled) =>
              update((s) => ({
                ...s,
                customSites: s.customSites.map((x) => (x.id === id ? { ...x, enabled } : x)),
              }))
            }
            onEdit={(id, name, url) =>
              update((s) => ({
                ...s,
                customSites: s.customSites.map((x) => (x.id === id ? { ...x, name, url } : x)),
              }))
            }
            onDelete={(id) =>
              update((s) => ({ ...s, customSites: s.customSites.filter((x) => x.id !== id) }))
            }
            onAdd={(name, url) =>
              update((s) => ({
                ...s,
                customSites: [
                  ...s.customSites,
                  { id: crypto.randomUUID(), name, url, dateAdded: Date.now(), enabled: true },
                ],
              }))
            }
          />
        ) : tab === 'settings' ? (
          <SettingsPanel
            theme={theme}
            onThemeChange={setTheme}
            hasPassword={lock.hasPassword}
            schedule={schedule}
            onScheduleChange={setSchedule}
          />
        ) : (
          <>
            <div className="master">
              <Switch
                small
                label={`Block ${CATEGORY_LABEL[tab]}`}
                checked={state.categories[tab]}
                onChange={(on) => update((s) => ({ ...s, categories: { ...s.categories, [tab]: on } }))}
              />
              <p>
                {state.categories[tab]
                  ? `Blocking ${CATEGORY_LABEL[tab]} (the sites switched on below).`
                  : `Turn this on to block the sites switched on below. Same as “block ${CATEGORY_LABEL[tab]}” in the popup.`}
              </p>
            </div>
            <SiteTable
              rows={PRESETS_BY_CATEGORY[tab].map((p) => ({
                id: p.id,
                name: p.name,
                url: p.url,
                timesBlocked: blockCounts[p.url] ?? 0,
                enabled: isPresetEnabled(state, p.id),
                editable: false,
              }))}
              onToggle={(id, enabled) =>
                update((s) => ({ ...s, presetEnabled: { ...s.presetEnabled, [id]: enabled } }))
              }
            />
          </>
        )}
      </section>
    </main>
  )
}
