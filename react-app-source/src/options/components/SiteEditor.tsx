import { useState } from 'react'
import type { FormEvent } from 'react'
import { validateSite } from '../../shared/url'
import { Favicon } from './Favicon'

type SiteEditorProps = {
  initialName?: string
  initialUrl?: string
  submitLabel: string
  /** Normalised URLs the new value must not match (the site being edited excluded). */
  existingUrls: string[]
  onSubmit: (name: string, url: string) => void
  onCancel: () => void
}

/** A table row with name + URL inputs. Used for both "add" and "edit". */
export function SiteEditor({
  initialName = '',
  initialUrl = '',
  submitLabel,
  existingUrls,
  onSubmit,
  onCancel,
}: SiteEditorProps) {
  const [name, setName] = useState(initialName)
  const [url, setUrl] = useState(initialUrl)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const result = validateSite(name, url, existingUrls)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onSubmit(result.name, result.url)
  }

  return (
    <tr className="site-row editing">
      <td className="cell-icon">
        <Favicon url={initialUrl} />
      </td>
      <td colSpan={2} className="cell-form">
        {/* The form wraps the inputs inside one cell so Enter submits and Escape cancels. */}
        <form
          id="site-editor"
          className="editor-fields"
          onSubmit={submit}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        >
          <input
            className="text-input"
            type="text"
            placeholder="Name (optional)"
            aria-label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            className="text-input"
            type="text"
            placeholder="www.example.com"
            aria-label="URL"
            aria-invalid={error !== null}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
          />
        </form>
      </td>
      <td colSpan={3} className="cell-error" role="alert">
        {error}
      </td>
      <td className="cell-actions">
        <button type="submit" form="site-editor" className="pill">
          {submitLabel}
        </button>
        <button type="button" className="pill pill-light" onClick={onCancel}>
          cancel
        </button>
      </td>
    </tr>
  )
}
