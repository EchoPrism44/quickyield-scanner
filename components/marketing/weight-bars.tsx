'use client'

import { motion, useReducedMotion } from 'motion/react'
import { WEIGHTS } from '../../lib/grade'

const EASE = [0.16, 1, 0.3, 1] as const

const SIGNALS: Array<{ key: keyof typeof WEIGHTS; name: string; blurb: string }> = [
  { key: 'liquidity', name: 'Liquidity', blurb: 'How much value backs the pool, and how deep it is.' },
  { key: 'stability', name: 'APY stability', blurb: 'How steady the yield has been, not just its headline.' },
  { key: 'sustainability', name: 'Reward quality', blurb: 'How much of the APY is real yield vs. incentive emissions.' },
  { key: 'completeness', name: 'Data completeness', blurb: 'How much of the picture the market feed actually shows.' },
]

/**
 * The four Safety-Grade signals with their real model weights.
 * Renders from the exported WEIGHTS constant in lib/grade.ts, so the
 * marketing site can never drift from what the model actually does.
 */
export function WeightBars({ detailed = false }: { detailed?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <div className="ql-weights">
      {SIGNALS.map((s, i) => {
        const pct = Math.round(WEIGHTS[s.key] * 100)
        return (
          <div className="ql-weight" key={s.key}>
            <div className="ql-weight-head">
              <span className="ql-weight-name">{s.name}</span>
              <span className="ql-weight-pct">{pct}%</span>
            </div>
            <div className="ql-weight-track">
              <motion.div
                className="ql-weight-fill"
                initial={reduce ? { width: `${pct}%` } : { width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.9, delay: i * 0.08, ease: EASE }}
              />
            </div>
            {detailed && <p className="ql-weight-blurb">{s.blurb}</p>}
          </div>
        )
      })}
    </div>
  )
}
