'use client'

import { motion, useReducedMotion } from 'motion/react'
import { GRADE_LETTERS, type GradeDistribution } from '../../lib/ledger'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Horizontal A–F distribution bars for one ledger snapshot.
 * Bar widths animate in when scrolled into view; colors come from the
 * --grade-* tokens so every surface renders grades identically.
 */
export function GradeDistributionBars({
  dist,
  compact = false,
  animate = true,
}: {
  dist: GradeDistribution
  compact?: boolean
  animate?: boolean
}) {
  const reduce = useReducedMotion()
  const total = GRADE_LETTERS.reduce((sum, g) => sum + dist[g], 0) || 1
  const skipAnimation = reduce || !animate

  return (
    <div className={`ql-dist ${compact ? 'ql-dist--compact' : ''}`} role="img"
      aria-label={GRADE_LETTERS.map((g) => `${g}: ${dist[g].toLocaleString()}`).join(', ')}>
      {GRADE_LETTERS.map((g, i) => {
        const pct = (dist[g] / total) * 100
        return (
          <div className="ql-dist-row" key={g}>
            <span className="ql-dist-letter" style={{ color: `var(--grade-${g.toLowerCase()})` }}>{g}</span>
            <div className="ql-dist-track">
              <motion.div
                className="ql-dist-fill"
                style={{ background: `var(--grade-${g.toLowerCase()})` }}
                initial={skipAnimation ? { width: `${pct}%` } : { width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: EASE }}
              />
            </div>
            {!compact && <span className="ql-dist-count">{dist[g].toLocaleString()}</span>}
          </div>
        )
      })}
    </div>
  )
}
