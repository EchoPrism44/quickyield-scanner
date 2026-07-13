'use client'

import { motion, useReducedMotion } from 'motion/react'
import { type LedgerSnapshotSummary } from '../../lib/ledger-shared'
import { GradeDistributionBars } from './grade-distribution-bars'

const EASE = [0.16, 1, 0.3, 1] as const

/** Full snapshot history — newest first, one visual card per weekly record. */
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
        </motion.div>
      ))}
    </div>
  )
}
