'use client'

import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, Layers } from 'lucide-react'
import Link from 'next/link'
import { type LedgerSummary } from '../../lib/ledger-shared'
import { GradeDistributionBars } from './grade-distribution-bars'
import { StatCounter } from './stat-counter'
import { OnChainBadge } from './onchain-badge'

const EASE = [0.16, 1, 0.3, 1] as const
const MAX_RAIL_BLOCKS = 4

function nextMonday(): string {
  const d = new Date()
  const day = d.getUTCDay()
  const add = ((8 - day) % 7) || 7
  d.setUTCDate(d.getUTCDate() + add)
  return d.toISOString().slice(0, 10)
}

/**
 * Hero centerpiece: the weekly grade record rendered as a rail of snapshots.
 * Every block is a real weekly snapshot — dates, counts, and distributions
 * all come from published data, never invented. The on-chain badge reflects
 * the Base anchor (or its "launching soon" state).
 */
export function LedgerHero({ ledger }: { ledger: LedgerSummary | null }) {
  const reduce = useReducedMotion()

  if (!ledger) {
    return (
      <div className="ql-ledger" aria-label="Weekly grade record">
        <div className="ql-ledger-bar">
          <Layers size={13} /> weekly grade record
        </div>
        <div className="ql-ledger-rail">
          <div className="ql-ledger-block ql-ledger-block--ghost">
            <span className="ql-ledger-ghost-label">The weekly track record loads here</span>
          </div>
        </div>
        <div className="ql-ledger-foot">
          <Link href="/proof">
            see the track record <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    )
  }

  const rail = ledger.snapshots.slice(-MAX_RAIL_BLOCKS)
  const latestDate = ledger.latest.date

  return (
    <div className="ql-ledger" aria-label="Weekly grade record — snapshots">
      <div className="ql-ledger-bar">
        <Layers size={13} />
        <span>weekly grade record</span>
        <b>
          <span className="ql-dot" />
          {ledger.totals.snapshotCount} snapshots
        </b>
      </div>

      <div className="ql-ledger-rail">
        {rail.map((snap, i) => {
          const isLatest = snap.date === latestDate
          return (
            <motion.div
              className="ql-ledger-block"
              key={snap.date}
              initial={reduce ? false : { opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: reduce ? 0 : 0.25 + i * 0.15, ease: EASE }}
            >
              <div className="ql-ledger-head">
                <span className="ql-ledger-date">{snap.date}</span>
                <span className="ql-ledger-count">
                  {isLatest ? (
                    <>
                      <StatCounter value={snap.count} /> pools graded
                    </>
                  ) : (
                    `${snap.count.toLocaleString()} pools graded`
                  )}
                </span>
              </div>
              {isLatest && <GradeDistributionBars dist={snap.dist} compact />}
            </motion.div>
          )
        })}

        <motion.div
          className="ql-ledger-block ql-ledger-block--ghost"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: reduce ? 0 : 0.25 + rail.length * 0.15, ease: EASE }}
        >
          <div className="ql-ledger-head">
            <span className="ql-ledger-ghost-label">next snapshot · {nextMonday()}</span>
          </div>
        </motion.div>
      </div>

      <div className="ql-ledger-foot">
        <OnChainBadge size="sm" />
        <Link href="/proof">
          track record <ArrowUpRight size={11} />
        </Link>
      </div>
    </div>
  )
}
