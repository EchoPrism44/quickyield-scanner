import type { QuickYieldScoreBreakdown, SafetyGrade, SafetyGradeLetter } from './types'

/**
 * QuickYield Safety Grade — the product's core, transparent IP.
 *
 * Distills the four scoring dimensions into a single A–F letter so a pool can be
 * judged at a glance. Pure and dependency-free so it can run on both the server
 * (attached to opportunities) and the client (landing + terminal display).
 */

const WEIGHTS = {
  liquidity: 0.3,
  stability: 0.3,
  sustainability: 0.25,
  completeness: 0.15,
} as const

function bandFor(score: number): { letter: SafetyGradeLetter; label: string } {
  if (score >= 85) return { letter: 'A', label: 'Very safe' }
  if (score >= 72) return { letter: 'B', label: 'Safe' }
  if (score >= 60) return { letter: 'C', label: 'Moderate' }
  if (score >= 45) return { letter: 'D', label: 'Elevated risk' }
  return { letter: 'F', label: 'High risk' }
}

export function computeSafetyGrade(b: QuickYieldScoreBreakdown): SafetyGrade {
  const score = Math.round(
    Math.min(100, Math.max(0,
      b.liquidity * WEIGHTS.liquidity +
      b.stability * WEIGHTS.stability +
      b.sustainability * WEIGHTS.sustainability +
      b.completeness * WEIGHTS.completeness,
    )),
  )
  const { letter, label } = bandFor(score)

  const dims: Array<[string, number]> = [
    ['liquidity', b.liquidity],
    ['APY stability', b.stability],
    ['reward quality', b.sustainability],
    ['data completeness', b.completeness],
  ]
  const weakest = dims.reduce((min, d) => (d[1] < min[1] ? d : min), dims[0])
  const summary = `Weighted blend of liquidity, APY stability, reward quality, and data completeness. Weakest factor: ${weakest[0]} (${weakest[1]}/100).`

  return { letter, score, label, summary, weakest: weakest[0] }
}

/** Lowercase tone token for CSS class suffixes (ql-grade-*, qy-grade-*). */
export function gradeTone(letter: SafetyGradeLetter): string {
  return letter.toLowerCase()
}

/** Resolve a grade for an opportunity, falling back to computing from the breakdown. */
export function safetyGradeOf(o: { safety?: SafetyGrade; scoreBreakdown: QuickYieldScoreBreakdown }): SafetyGrade {
  return o.safety ?? computeSafetyGrade(o.scoreBreakdown)
}
