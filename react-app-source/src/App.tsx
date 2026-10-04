import blockrIcon from './assets/blockr-icon.svg'
import { Switch } from './shared/Switch'
import { countBlocked } from './shared/blocking'
import { useBlockList } from './shared/useBlockList'
import './App.css'

type ToggleProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="row">
      <Switch label={label} checked={checked} onChange={onChange} />
      <p>{label}</p>
    </div>
  )
}

function App() {
  const { state, update } = useBlockList()

  // Wait for storage so the popup doesn't flash "0 sites".
  if (!state) return null

  const blockedCount = countBlocked(state)
  const setCategory = (category: 'social' | 'shortForm') => (on: boolean) =>
    update((s) => ({ ...s, categories: { ...s.categories, [category]: on } }))

  return (
    <>
      <div className="title">
        <img src={blockrIcon} id="blockrIcon" alt="" />
        <h1>Blockr</h1>
      </div>
      <div className="container">
        <p>
          currently blocking {blockedCount} {blockedCount === 1 ? 'site' : 'sites'}
        </p>
        <button id="disableButton">disable</button>
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
        <button id="blockListButton" onClick={() => chrome.runtime.openOptionsPage()}>
          edit block list
        </button>
      </div>
    </>
  )
}

export default App
