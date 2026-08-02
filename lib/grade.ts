import type { LitmusScoreBreakdown, SafetyGrade, SafetyGradeLetter } from './types'

/**
 * Litmus Safety Grade — the product's core, transparent IP.
 *
 * Distills the four scoring dimensions into a single A–F letter so a pool can be
 * judged at a glance. Pure and dependency-free so it can run on both the server
 * (attached to opportunities) and the client (landing + terminal display).
 */

/** Signal weights behind every Safety Grade. Exported so the public
 *  methodology docs render from the same constants the model uses. */
export const WEIGHTS = {
  liquidity: 0.3,
  stability: 0.3,
  sustainability: 0.25,
  completeness: 0.15,
} as const

/** Grade bands (min score → letter). Exported for the methodology docs. */
export const BANDS: ReadonlyArray<{ letter: SafetyGradeLetter; min: number; label: string }> = [
  { letter: 'A', min: 85, label: 'Very safe' },
  { letter: 'B', min: 72, label: 'Safe' },
  { letter: 'C', min: 60, label: 'Moderate' },
  { letter: 'D', min: 45, label: 'Elevated risk' },
  { letter: 'F', min: 0, label: 'High risk' },
]

function bandFor(score: number): { letter: SafetyGradeLetter; label: string } {
  const band = BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]
  return { letter: band.letter, label: band.label }
}

export function computeSafetyGrade(b: LitmusScoreBreakdown): SafetyGrade {
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
export function safetyGradeOf(o: { safety?: SafetyGrade; scoreBreakdown: LitmusScoreBreakdown }): SafetyGrade {
  return o.safety ?? computeSafetyGrade(o.scoreBreakdown)
}
