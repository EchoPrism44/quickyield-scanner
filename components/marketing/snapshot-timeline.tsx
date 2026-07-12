'use client'

import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { GRADE_LETTERS, type LedgerSnapshotSummary } from '../../lib/ledger-shared'
import { GradeDistributionBars } from './grade-distribution-bars'

const EASE = [0.16, 1, 0.3, 1] as const

/** Full snapshot history — newest first, one card per committed week. */
export function SnapshotTimeline({ snapshots }: { snapshots: LedgerSnapshotSummary[] }) {
  const reduce = useReducedMotion()
  const newestFirst = [...snapshots].reverse()
  return (
    <div className="ql-proof-timeline">
      {newestFirst.map((snap, i) => (
        <motion.div
          className="ql-proof-snap"
          key={snap.date}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: reduce ? 0 : Math.min(i, 6) * 0.06, ease: EASE }}
        >
          <div className="ql-proof-snap-head">
            <span className="ql-proof-snap-date">{snap.date}</span>
            <span className="ql-proof-snap-meta">
              {snap.count.toLocaleString()} pools · {snap.chains} chains
            </span>
          </div>
          <GradeDistributionBars dist={snap.dist} />
          <a className="ql-ledger-json" href={snap.githubUrl} target="_blank" rel="noreferrer">
            raw JSON <ArrowUpRight size={10} />
          </a>
        </motion.div>
      ))}
    </div>
  )
}

/** Stacked-percentage strip per snapshot — how the distribution evolves. */
export function DistributionEvolution({ snapshots }: { snapshots: LedgerSnapshotSummary[] }) {
  return (
    <div className="ql-evolution">
      {snapshots.map((snap) => {
        const total = GRADE_LETTERS.reduce((sum, g) => sum + snap.dist[g], 0) || 1
        return (
          <div className="ql-evolution-row" key={snap.date}>
            <span className="ql-evolution-date">{snap.date}</span>
            <div className="ql-evolution-bar" role="img"
              aria-label={GRADE_LETTERS.map((g) => `${g} ${Math.round((snap.dist[g] / total) * 100)}%`).join(', ')}>
              {GRADE_LETTERS.map((g) => (
                <span
                  key={g}
                  className="ql-evolution-seg"
                  style={{
                    width: `${(snap.dist[g] / total) * 100}%`,
                    background: `var(--grade-${g.toLowerCase()})`,
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
