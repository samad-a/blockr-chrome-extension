import { useState } from 'react'
import type { FormEvent } from 'react'
import { parseLimit } from '../../shared/usage'
import { validateSite } from '../../shared/url'
import { Favicon } from './Favicon'

type SiteEditorProps = {
  initialName?: string
  initialUrl?: string
  initialLimit?: number
  /** Shown for an existing site, e.g. "added 30/09/26". */
  addedLabel?: string
  submitLabel: string
  /** Normalised URLs the new value must not match (the site being edited excluded). */
  existingUrls: string[]
  onSubmit: (name: string, url: string, dailyLimit: number | undefined) => void
  onCancel: () => void
}

/** A table row with name, URL and daily-limit inputs. Used for both "add" and "edit". */
export function SiteEditor({
  initialName = '',
  initialUrl = '',
  initialLimit,
  addedLabel,
  submitLabel,
  existingUrls,
  onSubmit,
  onCancel,
}: SiteEditorProps) {
  const [name, setName] = useState(initialName)
  const [url, setUrl] = useState(initialUrl)
  const [limit, setLimit] = useState(initialLimit ? String(initialLimit) : '')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const site = validateSite(name, url, existingUrls)
    if (!site.ok) {
      setError(site.error)
      return
    }
    const parsedLimit = parseLimit(limit)
    if (!parsedLimit.ok) {
      setError(parsedLimit.error)
      return
    }
    onSubmit(site.name, site.url, parsedLimit.minutes)
  }

  const cancelOnEscape = (e: { key: string }) => e.key === 'Escape' && onCancel()

  return (
    <tr className="site-row editing">
      <td className="cell-icon">
        <Favicon url={initialUrl} />
      </td>
      <td colSpan={2} className="cell-form">
        {/* The form wraps the inputs inside one cell so Enter submits and Escape cancels. */}
        <form id="site-editor" className="editor-fields" onSubmit={submit} onKeyDown={cancelOnEscape}>
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
        {error && (
          <p className="editor-error" role="alert">
            {error}
          </p>
        )}
      </td>
      <td colSpan={2} className="cell-limit-edit">
        <label className="limit-field">
          <span>limit</span>
          <input
            className="text-input"
            type="text"
            inputMode="numeric"
            form="site-editor"
            placeholder="none"
            aria-label="Daily limit in minutes"
            value={limit}
            onChange={(e) => {
              setLimit(e.target.value)
              setError(null)
            }}
            onKeyDown={cancelOnEscape}
          />
          <span>min per day</span>
        </label>
      </td>
      <td className="cell-added">{addedLabel}</td>
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
