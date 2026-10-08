import { useState } from 'react'
import { MAX_CUSTOM_SITES } from '../shared/backup'
import { limitedSites } from '../shared/blocking'
import { useLock } from '../shared/useLock'
import { isPaused } from '../shared/local'
import { scheduleOffText } from '../shared/schedule'
import { secondsUsed } from '../shared/usage'
import { useSchedule } from '../shared/useSchedule'
import { useTheme } from '../shared/theme'
import { useBlockList } from '../shared/useBlockList'
import { useLocalState } from '../shared/useLocalState'
import { LockScreen } from './components/LockScreen'
import { PrivateWindowsNotice } from './components/PrivateWindowsNotice'
import { WhatsNewNotice } from './components/WhatsNewNotice'
import { PasswordSettings } from './components/PasswordSettings'
import { PresetsPanel } from './components/PresetsPanel'
import { ScheduleSettings } from './components/ScheduleSettings'
import { SettingsPanel } from './components/SettingsPanel'
import { SiteTable } from './components/SiteTable'
import type { SiteRowData } from './components/SiteRow'
import { Sidebar } from './components/Sidebar'
import type { SectionDef } from './components/Sidebar'
import './options.css'

// Ko-fi page (opens in a new tab).
const DONATE_URL = 'https://ko-fi.com/samaddev'

type SectionId = 'custom' | 'presets' | 'schedule' | 'password' | 'settings'

const SECTIONS: SectionDef<SectionId>[] = [
  { id: 'custom', label: 'Block list' },
  { id: 'presets', label: 'Presets' },
  { id: 'schedule', label: 'Schedule', group: 'control' },
  { id: 'password', label: 'Password', group: 'control' },
  { id: 'settings', label: 'Settings', group: 'control' },
]

const TITLES: Record<SectionId, string> = {
  custom: 'Custom block list',
  presets: 'Presets',
  schedule: 'Schedule',
  password: 'Password protection',
  settings: 'Settings',
}

// The welcome page links to #settings; each section has its own hash so refresh and back keep your place.
const sectionFromHash = (): SectionId =>
  SECTIONS.find((section) => `#${section.id}` === window.location.hash)?.id ?? 'custom'

export default function OptionsApp() {
  const { state, update, error, readOnly } = useBlockList()
  const { blockCounts, usage, pause } = useLocalState()
  const lock = useLock()
  const { theme, setTheme } = useTheme()
  const { schedule, setSchedule, loaded: scheduleLoaded } = useSchedule()
  const [section, setSection] = useState<SectionId>(sectionFromHash)

  const goTo = (id: SectionId) => {
    setSection(id)
    window.history.replaceState(null, '', `#${id}`)
  }

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
    <div className="options">
      <Sidebar sections={SECTIONS} active={section} onChange={goTo} donateUrl={DONATE_URL} />

      <main className="content">
        <WhatsNewNotice />
        <PrivateWindowsNotice />

        <section className="card" aria-labelledby="section-title">
          <h2 id="section-title" className="section-title">
            {TITLES[section]}
          </h2>

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

          {section === 'custom' && limitsIdleReason && (
            <p className="banner" role="status">
              Daily limits aren&rsquo;t counting right now: {limitsIdleReason}.
            </p>
          )}

          {section === 'custom' && (
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
          )}

          {section === 'presets' && <PresetsPanel state={state} blockCounts={blockCounts} update={update} />}

          {section === 'schedule' && (
            <div className="settings">
              <ScheduleSettings schedule={schedule} onChange={setSchedule} />
            </div>
          )}

          {section === 'password' && (
            <div className="settings">
              <PasswordSettings hasPassword={lock.hasPassword} />
            </div>
          )}

          {section === 'settings' && (
            <SettingsPanel
              theme={theme}
              onThemeChange={setTheme}
              customSites={state.customSites}
              onCustomSitesChange={(customSites) => update((s) => ({ ...s, customSites }))}
            />
          )}
        </section>
      </main>
    </div>
  )
}
