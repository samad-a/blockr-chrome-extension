import blockrIcon from './assets/blockr-icon.svg'
import { PauseControl } from './PauseControl'
import { Switch } from './shared/Switch'
import { countBlocked } from './shared/blocking'
import { isPaused } from './shared/local'
import { useBlockList } from './shared/useBlockList'
import { useLocalState } from './shared/useLocalState'
import './App.css'

type ToggleProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="row">
      <Switch small label={label} checked={checked} onChange={onChange} />
      <p>{label}</p>
    </div>
  )
}

function App() {
  const { state, update } = useBlockList()
  const { pause } = useLocalState()

  // Wait for storage so the popup doesn't flash "0 sites".
  if (!state) return null

  const blockedCount = countBlocked(state)
  const paused = isPaused(pause)
  const status = !paused
    ? `blocking ${blockedCount} ${blockedCount === 1 ? 'site' : 'sites'}`
    : pause?.until
      ? `paused until ${new Date(pause.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : 'paused'
  const setCategory = (category: 'social' | 'shortForm') => (on: boolean) =>
    update((s) => ({ ...s, categories: { ...s.categories, [category]: on } }))

  return (
    <div className="popup">
      <div className="title">
        <img src={blockrIcon} id="blockrIcon" alt="" />
        <h1>Blockr</h1>
      </div>
      <div className="container">
        <p className={paused || blockedCount === 0 ? 'status idle' : 'status'}>
          <span className="dot" aria-hidden />
          {status}
        </p>
        <PauseControl pause={pause} />
        <div className="panel">
          <Toggle
            label="block social media"
            checked={state.categories.social}
            onChange={setCategory('social')}
          />
          <Toggle
            label="block short-form content"
            checked={state.categories.shortForm}
            onChange={setCategory('shortForm')}
          />
        </div>
        <button id="blockListButton" className="secondary" onClick={() => chrome.runtime.openOptionsPage()}>
          edit block list
        </button>
      </div>
    </div>
  )
}

export default App
