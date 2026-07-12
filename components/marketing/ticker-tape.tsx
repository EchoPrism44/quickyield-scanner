import { computeSafetyGrade } from '../../lib/grade'
import type { Opportunity } from '../../lib/types'

/**
 * Horizontal ticker of live pools (CSS marquee — no JS animation).
 * Rows are doubled for a seamless loop. Server-renderable.
 */
export function TickerTape({ rows }: { rows: Opportunity[] }) {
  const base = rows.slice(0, 8)
  if (base.length === 0) return null
  const doubled = [...base, ...base]
  return (
    <div className="ql-tape" aria-hidden="true">
      <div className="ql-tape-track">
        {doubled.map((item, i) => {
          const grade = (item.safety ?? computeSafetyGrade(item.scoreBreakdown)).letter
          const sign = item.trend === 'down' ? '-' : '+'
          const cls = item.trend === 'down' ? 'ql-down' : 'ql-up'
          return (
            <span className="ql-tape-item" key={`${item.id}-${i}`}>
              <b>{item.asset}</b> {item.platform} · {item.apy.toFixed(2)}%
              <span className={`ql-grade-chip ql-grade-${grade.toLowerCase()}`}>{grade}</span>
              <span className={cls}>{sign}{Math.abs(item.trendValue).toFixed(2)}%</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
