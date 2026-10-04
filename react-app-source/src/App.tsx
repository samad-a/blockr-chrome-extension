import { useState } from 'react'
import blockrIcon from './assets/blockr-icon.svg'
import './App.css'

type ToggleProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="row">
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
        />
        <span className="slider round"></span>
      </label>
      <p>{label}</p>
    </div>
  )
}

function App() {
  // UI state only for now; saving to chrome.storage and the actual
  // blocking come next.
  const [blockedCount] = useState(0)
  const [blockSocial, setBlockSocial] = useState(false)
  const [blockShortForm, setBlockShortForm] = useState(false)

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
          checked={blockSocial}
          onChange={setBlockSocial}
        />
        <Toggle
          label="block short-form content"
          checked={blockShortForm}
          onChange={setBlockShortForm}
        />
        <button id="blockListButton">edit block list</button>
      </div>
    </>
  )
}

export default App
