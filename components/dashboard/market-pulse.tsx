import { ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react'
import type { WeekOverWeekDelta } from '../../lib/snapshot-delta'

/**
 * Week-over-week summary strip, above the Discover KPI cards. Reuses the
 * same diff engine as scripts/analyze-snapshot.ts (lib/snapshot-delta.ts) —
 * every number here is real, sourced from the two most recent committed
 * grade snapshots. Renders nothing if fewer than two snapshots exist yet.
 */
export function MarketPulse({ delta }: { delta: WeekOverWeekDelta | null | undefined }) {
  if (!delta) return null

  const safeShareChange = delta.safeShareCurr - delta.safeSharePrev
  const safeShareLabel =
    safeShareChange === 0 ? 'steady' : `${safeShareChange > 0 ? '+' : ''}${safeShareChange}pp`

  return (
    <div className="qy-market-pulse" aria-label={`Market pulse: change from ${delta.prevDate} to ${delta.currDate}`}>
      <span className="qy-market-pulse-label">
        <Sparkles size={13} /> Market pulse
      </span>
      <span className="qy-market-pulse-item qy-market-pulse-up">
        <ArrowUpRight size={14} /> {delta.upgradedCount} upgraded
      </span>
      <span className="qy-market-pulse-item qy-market-pulse-down">
        <ArrowDownRight size={14} /> {delta.downgradedCount} downgraded
      </span>
      <span className="qy-market-pulse-item">
        {delta.poolsDelta >= 0 ? '+' : ''}{delta.poolsDelta} pools this week
      </span>
      <span className="qy-market-pulse-item">
        Safe share {delta.safeShareCurr}% ({safeShareLabel})
      </span>
      <span className="qy-market-pulse-since">since {delta.prevDate}</span>
    </div>
  )
}
