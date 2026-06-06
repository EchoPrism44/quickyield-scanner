import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { safetyGradeOf } from '../lib/grade'
import type { Opportunity } from '../lib/types'

export function YieldTable({ items }: { items: Opportunity[] }) {
  if (items.length === 0) {
    return <p className="ql-lead">No pools match right now — the scanner refreshes regularly, check back soon.</p>
  }
  return (
    <div className="ql-yield-table">
      <div className="ql-yield-head">
        <span>Pool</span>
        <span className="hide-sm">Chain</span>
        <span>APY</span>
        <span>Grade</span>
        <span className="hide-sm">TVL</span>
        <span />
      </div>
      {items.map((o) => {
        const g = safetyGradeOf(o)
        return (
          <div className="ql-yield-row" key={o.id}>
            <div className="ql-yield-pool">
              <b>{o.platform}</b>
              <small>{o.asset} · {o.chain}</small>
            </div>
            <span className="hide-sm">{o.chain}</span>
            <span className="num">{o.apy.toFixed(2)}%</span>
            <span><span className={`ql-grade-chip ql-grade-${g.letter.toLowerCase()}`} title={`Safety Grade ${g.letter} — ${g.label}`}>{g.letter}</span></span>
            <span className="num hide-sm">{o.tvl}</span>
            <Link href="/terminal" className="ql-btn ql-btn--ghost ql-btn--sm" aria-label={`Open ${o.platform} in the terminal`}>
              Open <ArrowRight size={13} />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
