import { useState } from 'react'
import { SiteEditor } from './SiteEditor'
import { SiteRow } from './SiteRow'
import type { SiteRowData } from './SiteRow'

type SiteTableProps = {
  rows: SiteRowData[]
  emptyMessage?: string
  onToggle: (id: string, enabled: boolean) => void
  onEdit?: (id: string, name: string, url: string) => void
  onDelete?: (id: string) => void
  /** Providing this shows the "+ Add new item" row. */
  onAdd?: (name: string, url: string) => void
}

export function SiteTable({ rows, emptyMessage, onToggle, onEdit, onDelete, onAdd }: SiteTableProps) {
  const [adding, setAdding] = useState(false)
  const allUrls = rows.map((r) => r.url)

  return (
    <table className="site-table">
      <thead>
        <tr>
          <th className="cell-icon" />
          <th>name</th>
          <th>URL</th>
          <th className="cell-center">date added</th>
          <th className="cell-center">times blocked</th>
          <th className="cell-center">block</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && !onAdd && (
          <tr>
            <td colSpan={7} className="empty">
              {emptyMessage}
            </td>
          </tr>
        )}
        {rows.map((site) => (
          <SiteRow
            key={site.id}
            site={site}
            otherUrls={allUrls.filter((u) => u !== site.url)}
            onToggle={(enabled) => onToggle(site.id, enabled)}
            onEdit={(name, url) => onEdit?.(site.id, name, url)}
            onDelete={() => onDelete?.(site.id)}
          />
        ))}
        {onAdd &&
          (adding ? (
            <SiteEditor
              submitLabel="add"
              existingUrls={allUrls}
              onSubmit={(name, url) => {
                onAdd(name, url)
                setAdding(false)
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <tr className="site-row add-row">
              <td colSpan={7}>
                <button type="button" className="add-button" onClick={() => setAdding(true)}>
                  <span className="plus" aria-hidden>
                    +
                  </span>
                  Add new item to block list
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}
