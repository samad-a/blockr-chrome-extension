import { useState } from 'react'
import { SiteEditor } from './SiteEditor'
import { SiteRow } from './SiteRow'
import type { SiteRowData } from './SiteRow'

type SiteTableProps = {
  rows: SiteRowData[]
  emptyMessage?: string
  onToggle: (id: string, enabled: boolean) => void
  onEdit?: (id: string, name: string, url: string, dailyLimit: number | undefined) => void
  onDelete?: (id: string) => void
  /** Providing this shows the "+ Add new item" row. */
  onAdd?: (name: string, url: string, dailyLimit: number | undefined) => void
  /** When set, the add row shows this instead of the add button. */
  addDisabledReason?: string
}

export function SiteTable({
  rows,
  emptyMessage,
  onToggle,
  onEdit,
  onDelete,
  onAdd,
  addDisabledReason,
}: SiteTableProps) {
  const [adding, setAdding] = useState(false)
  const allUrls = rows.map((r) => r.url)
  // Only the custom list (the one you can add to) supports daily limits.
  const showLimit = onAdd !== undefined

  return (
    <table className="site-table">
      <thead>
        <tr>
          <th className="cell-icon" />
          <th>name</th>
          <th>URL</th>
          <th className="cell-center col-times">times blocked</th>
          {showLimit && <th>daily limit</th>}
          <th className="cell-center col-block">block</th>
          <th className="col-end" />
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
            showLimit={showLimit}
            otherUrls={allUrls.filter((u) => u !== site.url)}
            onToggle={(enabled) => onToggle(site.id, enabled)}
            onEdit={(name, url, dailyLimit) => onEdit?.(site.id, name, url, dailyLimit)}
            onDelete={() => onDelete?.(site.id)}
          />
        ))}
        {onAdd &&
          (adding ? (
            <SiteEditor
              submitLabel="add"
              existingUrls={allUrls}
              onSubmit={(name, url, dailyLimit) => {
                onAdd(name, url, dailyLimit)
                setAdding(false)
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <tr className="site-row add-row">
              <td colSpan={7}>
                {addDisabledReason ? (
                  <p className="add-disabled">{addDisabledReason}</p>
                ) : (
                  <button type="button" className="add-button" onClick={() => setAdding(true)}>
                    <span className="plus" aria-hidden>
                      +
                    </span>
                    Add new item to block list
                  </button>
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}
