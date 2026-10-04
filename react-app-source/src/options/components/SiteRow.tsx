import { useState } from 'react'
import { Switch } from '../../shared/Switch'
import { formatDate } from '../../shared/url'
import { Favicon } from './Favicon'
import { SiteEditor } from './SiteEditor'

export type SiteRowData = {
  id: string
  name: string
  url: string
  /** Epoch ms. Presets have none. */
  dateAdded?: number
  timesBlocked: number
  enabled: boolean
  /** Custom sites can be edited and deleted; presets can only be toggled. */
  editable: boolean
}

type SiteRowProps = {
  site: SiteRowData
  /** Normalised URLs of the other sites in the list, for the duplicate check. */
  otherUrls: string[]
  onToggle: (enabled: boolean) => void
  onEdit: (name: string, url: string) => void
  onDelete: () => void
}

export function SiteRow({ site, otherUrls, onToggle, onEdit, onDelete }: SiteRowProps) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <SiteEditor
        initialName={site.name}
        initialUrl={site.url}
        submitLabel="save"
        existingUrls={otherUrls}
        onSubmit={(name, url) => {
          onEdit(name, url)
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
      <td>{site.name}</td>
      <td>{site.url}</td>
      <td className="cell-center">{site.dateAdded ? formatDate(site.dateAdded) : '—'}</td>
      <td className="cell-center">{site.timesBlocked}</td>
      <td className="cell-center">
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
