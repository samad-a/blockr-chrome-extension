import { useState } from 'react'
import { Switch } from '../../shared/Switch'
import { formatDate } from '../../shared/url'
import { Favicon } from './Favicon'
import { LimitCell } from './LimitCell'
import { SiteEditor } from './SiteEditor'

export type SiteRowData = {
  id: string
  name: string
  url: string
  /** Epoch ms. Presets have none. */
  dateAdded?: number
  timesBlocked: number
  /** Minutes per day, if a limit is set (custom sites only). */
  dailyLimit?: number
  /** Seconds spent on the site today, for the limit's progress bar. */
  usedSeconds?: number
  enabled: boolean
  /** Custom sites can be edited and deleted; presets can only be toggled. */
  editable: boolean
}

type SiteRowProps = {
  site: SiteRowData
  /** Show the "daily limit" column (custom list only). */
  showLimit: boolean
  /** Normalised URLs of the other sites in the list, for the duplicate check. */
  otherUrls: string[]
  onToggle: (enabled: boolean) => void
  onEdit: (name: string, url: string, dailyLimit: number | undefined) => void
  onDelete: () => void
}

export function SiteRow({ site, showLimit, otherUrls, onToggle, onEdit, onDelete }: SiteRowProps) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <SiteEditor
        initialName={site.name}
        initialUrl={site.url}
        initialLimit={site.dailyLimit}
        addedLabel={site.dateAdded ? `added ${formatDate(site.dateAdded)}` : undefined}
        submitLabel="save"
        existingUrls={otherUrls}
        onSubmit={(name, url, dailyLimit) => {
          onEdit(name, url, dailyLimit)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <tr className="site-row">
      <td className="cell-icon">
        <Favicon url={site.url} />
      </td>
      <td className="cell-name">{site.name}</td>
      <td className="cell-url">{site.url}</td>
      {site.dateAdded && (
        <td className="cell-date" data-label="Added">
          {formatDate(site.dateAdded)}
        </td>
      )}
      <td className="cell-center cell-times" data-label="Blocked">
        {site.timesBlocked}
      </td>
      {showLimit && (
        <td className="cell-limit" data-label="Limit">
          <LimitCell limit={site.dailyLimit} usedSeconds={site.usedSeconds ?? 0} />
        </td>
      )}
      <td className="cell-center cell-toggle">
        <Switch small label={`Block ${site.name}`} checked={site.enabled} onChange={onToggle} />
      </td>
      <td className="cell-actions">
        {site.editable && (
          <>
            <button type="button" className="pill" onClick={() => setEditing(true)}>
              edit
            </button>
            <button
              type="button"
              className="pill"
              onClick={() => {
                if (window.confirm(`Remove ${site.name} from your block list?`)) onDelete()
              }}
            >
              delete
            </button>
          </>
        )}
      </td>
    </tr>
  )
}
