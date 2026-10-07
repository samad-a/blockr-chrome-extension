import { useState } from 'react'
import blockrIcon from '../assets/blockr-icon.svg'
import { MAX_CUSTOM_SITES } from '../shared/backup'
import { isPresetEnabled, limitedSites } from '../shared/blocking'
import { PRESETS_BY_CATEGORY } from '../shared/presets'
import { Switch } from '../shared/Switch'
import { useLock } from '../shared/useLock'
import { isPaused } from '../shared/local'
import { scheduleOffText } from '../shared/schedule'
import { secondsUsed } from '../shared/usage'
import { useSchedule } from '../shared/useSchedule'
import { useTheme } from '../shared/theme'
import { useBlockList } from '../shared/useBlockList'
import { useLocalState } from '../shared/useLocalState'
import type { Category } from '../shared/types'
import { LockScreen } from './components/LockScreen'
import { PrivateWindowsNotice } from './components/PrivateWindowsNotice'
import { WhatsNewNotice } from './components/WhatsNewNotice'
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
  const { state, update, error, readOnly } = useBlockList()
  const { blockCounts, usage, pause } = useLocalState()
  const lock = useLock()
  const { theme, setTheme } = useTheme()
  const { schedule, setSchedule, loaded: scheduleLoaded } = useSchedule()
  // The welcome page links to #settings.
  const [tab, setTab] = useState<TabId>(() => (window.location.hash === '#settings' ? 'settings' : 'custom'))

  // Wait for storage (including the lock) so a locked page never flashes its contents.
  if (!state || !lock.ready || !scheduleLoaded) return null
  if (lock.locked) {
    return <LockScreen resetAt={lock.resetAt} lockedUntil={lock.lockedUntil} now={lock.now} />
  }

  // Daily limits only count while blocking is on, so say so when it isn't.
  const limitsIdleReason =
    limitedSites(state).length > 0
      ? isPaused(pause)
        ? 'blocking is paused'
        : (() => {
            const off = scheduleOffText(schedule)
            return off ? `blocking is ${off} (block schedule)` : null
          })()
      : null

  const customRows: SiteRowData[] = state.customSites.map((s) => ({
    ...s,
    timesBlocked: blockCounts[s.url] ?? 0,
    usedSeconds: secondsUsed(usage, s.url),
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

      <WhatsNewNotice />
      <PrivateWindowsNotice />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <section className="card" id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {readOnly && (
          <p className="banner" role="alert">
            This list was saved by a newer version of Blockr. Update Blockr to change it. Nothing has been altered.
          </p>
        )}
        {error && !readOnly && (
          <p className="banner" role="alert">
            Couldn&rsquo;t save: {error}
          </p>
        )}

        {tab === 'custom' && limitsIdleReason && (
          <p className="banner" role="status">
            Daily limits aren&rsquo;t counting right now: {limitsIdleReason}.
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
            onEdit={(id, name, url, dailyLimit) =>
              update((s) => ({
                ...s,
                customSites: s.customSites.map((x) => (x.id === id ? { ...x, name, url, dailyLimit } : x)),
              }))
            }
            onDelete={(id) =>
              update((s) => ({ ...s, customSites: s.customSites.filter((x) => x.id !== id) }))
            }
            addDisabledReason={
              state.customSites.length >= MAX_CUSTOM_SITES
                ? `You've reached the limit of ${MAX_CUSTOM_SITES} custom sites.`
                : undefined
            }
            onAdd={(name, url, dailyLimit) =>
              update((s) => ({
                ...s,
                customSites: [
                  ...s.customSites,
                  { id: crypto.randomUUID(), name, url, dateAdded: Date.now(), enabled: true, dailyLimit },
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
            customSites={state.customSites}
            onCustomSitesChange={(customSites) => update((s) => ({ ...s, customSites }))}
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
                url: p.urls[0],
                urlLabel: p.urls.join(', '),
                timesBlocked: p.urls.reduce((total, url) => total + (blockCounts[url] ?? 0), 0),
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
