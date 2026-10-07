type LimitCellProps = {
  /** Minutes per day, or undefined for no limit. */
  limit?: number
  usedSeconds: number
}

/** "12 / 20 min" with a thin progress bar, or "no limit". */
export function LimitCell({ limit, usedSeconds }: LimitCellProps) {
  if (!limit) return <span className="limit-none">no limit</span>

  const usedMinutes = Math.floor(usedSeconds / 60)
  const reached = usedSeconds >= limit * 60
  const percent = Math.min(100, Math.round((usedSeconds / (limit * 60)) * 100))

  return (
    <span className="limit-cell">
      <span
        className="limit-bar"
        role="progressbar"
        aria-label="Time used today"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(usedMinutes, limit)}
      >
        <i className={reached ? 'reached' : undefined} style={{ width: `${percent}%` }} />
      </span>
      <span>
        {Math.min(usedMinutes, limit)} / {limit} min
      </span>
      {reached && <span className="limit-tag">limit reached</span>}
    </span>
  )
}
