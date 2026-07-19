import { Layers, ShieldCheck, Network } from 'lucide-react'
import { GRADE_LETTERS, type LedgerSnapshotSummary } from '../../lib/ledger-shared'
import { GradeDistributionBars } from './grade-distribution-bars'
import { StatCounter } from './stat-counter'
import { OnChainBadge } from './onchain-badge'

/**
 * Layer-3 "Risk Cards" — a polished summary of the latest weekly snapshot:
 * the grade mix, pools graded, chains covered, and the safe share, each
 * carrying the on-chain trust badge. No raw data, no letter-soup.
 */
export function RiskCards({ latest }: { latest: LedgerSnapshotSummary }) {
  const total = GRADE_LETTERS.reduce((sum, g) => sum + latest.dist[g], 0) || 1
  const safePct = Math.round(((latest.dist.A + latest.dist.B) / total) * 100)

  return (
    <div className="ql-riskcards">
      <div className="ql-riskcard ql-riskcard--wide">
        <div className="ql-riskcard-head">
          <span className="ql-eyebrow">Latest grades · {latest.date}</span>
          <OnChainBadge size="sm" />
        </div>
        <GradeDistributionBars dist={latest.dist} />
      </div>

      <div className="ql-riskcard">
        <div className="ql-riskcard-ic"><Layers size={18} /></div>
        <div className="ql-riskcard-v"><StatCounter value={latest.count} /></div>
        <div className="ql-riskcard-l">Pools graded this week</div>
      </div>

      <div className="ql-riskcard">
        <div className="ql-riskcard-ic"><Network size={18} /></div>
        <div className="ql-riskcard-v"><StatCounter value={latest.chains} /></div>
        <div className="ql-riskcard-l">Chains covered</div>
      </div>

      <div className="ql-riskcard">
        <div className="ql-riskcard-ic"><ShieldCheck size={18} /></div>
        <div className="ql-riskcard-v"><StatCounter value={safePct} suffix="%" /></div>
        <div className="ql-riskcard-l">Graded A or B</div>
      </div>
    </div>
  )
}
