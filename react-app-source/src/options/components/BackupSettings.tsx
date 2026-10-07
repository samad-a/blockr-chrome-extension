import { useRef, useState } from 'react'
import { MAX_IMPORT_BYTES, describeImport, exportFileName, exportList, mergeImport, parseImport } from '../../shared/backup'
import type { CustomSite } from '../../shared/types'

type BackupSettingsProps = {
  sites: CustomSite[]
  /** Replaces the custom list (the caller saves it). */
  onSitesChange: (sites: CustomSite[]) => void
}

/** Save the custom list to a file, or add sites from one. Never deletes anything on import. */
export function BackupSettings({ sites, onSitesChange }: BackupSettingsProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const exportFile = () => {
    const blob = new Blob([exportList(sites)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = exportFileName()
    link.click()
    URL.revokeObjectURL(url)
    setMessage({ text: `Saved ${sites.length} ${sites.length === 1 ? 'site' : 'sites'} to a file.`, error: false })
  }

  const importFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage({ text: 'That file is too large to be a Blockr list.', error: true })
      return
    }
    const parsed = parseImport(await file.text())
    if ('error' in parsed) {
      setMessage({ text: parsed.error, error: true })
      return
    }
    const result = mergeImport(sites, parsed.sites, () => crypto.randomUUID())
    if (result.added > 0) onSitesChange(result.sites)
    setMessage({ text: describeImport(result, parsed.invalid), error: false })
  }

  return (
    <section className="settings-section">
      <h3>Backup and restore</h3>
      <p className="settings-help">
        Save your custom list to a file, or add sites from a file. Importing only adds sites: it skips ones you already
        have and never changes or removes anything.
      </p>
      <div className="password-actions">
        <button type="button" className="pill" onClick={exportFile} disabled={sites.length === 0}>
          export list
        </button>
        <button type="button" className="pill pill-light" onClick={() => fileInput.current?.click()}>
          import list
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          tabIndex={-1}
          aria-label="Choose a Blockr list file"
          onChange={(e) => {
            importFile(e.target.files?.[0])
            e.target.value = '' // so choosing the same file again still triggers a change
          }}
        />
      </div>
      {message && (
        <p className="settings-message" role={message.error ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
    </section>
  )
}
