'use client'

import { motion, useReducedMotion } from 'motion/react'
import { computeSafetyGrade } from '../../lib/grade'
import type { Opportunity } from '../../lib/types'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Live terminal panel — real rows from the live feed, staggered in with
 * motion. Copy stays honest: no invented counts.
 */
export function TerminalPreview({ rows }: { rows: Opportunity[] }) {
  const reduce = useReducedMotion()
  return (
    <div className="ql-terminal" aria-label="Live yield scanner preview">
      <div className="ql-terminal-bar">
        <i /><i /><i />
        <span>quickyield // live scanner</span>
        <b><span className="ql-dot" />synced</b>
      </div>
      <div className="ql-thead">
        <span>Pool</span><span>APY</span><span>Grade</span><span>24h</span>
      </div>
      {rows.slice(0, 5).map((item, i) => {
        const letter = (item.safety ?? computeSafetyGrade(item.scoreBreakdown)).letter
        const sign = item.trend === 'down' ? '-' : '+'
        const trendCls = item.trend === 'down' ? 'ql-down' : 'ql-up'
        return (
          <motion.div
            className="ql-trow"
            key={item.id}
            style={{ animation: 'none' }}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.08, ease: EASE }}
          >
            <div className="ql-asset">
              <b>{item.platform}</b>
              <small>{item.asset} · {item.chain}</small>
            </div>
            <span className="ql-apy">{item.apy.toFixed(2)}%</span>
            <span><span className={`ql-grade-chip ql-grade-${letter.toLowerCase()}`}>{letter}</span></span>
            <span className={trendCls}>{sign}{Math.abs(item.trendValue).toFixed(2)}%</span>
          </motion.div>
        )
      })}
      <div className="ql-terminal-foot">
        scanning live pools across major chains<span className="ql-cursor" />
      </div>
    </div>
  )
}
