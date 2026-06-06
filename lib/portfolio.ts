import type { PortfolioSummary, PositionView } from './types'

type Weighted = { amountUsd: number; apy: number }

/** Capital-weighted average APY across positions. */
export function blendedApy(rows: Weighted[]): number {
  const total = rows.reduce((sum, r) => sum + r.amountUsd, 0)
  if (total <= 0) return 0
  return rows.reduce((sum, r) => sum + r.amountUsd * r.apy, 0) / total
}

/** Projected yield over one year in USD at current rates. */
export function projectedAnnualUsd(rows: Weighted[]): number {
  return rows.reduce((sum, r) => sum + r.amountUsd * (r.apy / 100), 0)
}

/** Build the headline summary from enriched positions (uses current APY, falling back to entry APY). */
export function summarizePortfolio(positions: PositionView[]): PortfolioSummary {
  const rows = positions.map((p) => ({ amountUsd: p.amountUsd, apy: p.current?.apy ?? p.entryApy }))
  return {
    positionCount: positions.length,
    totalUsd: rows.reduce((sum, r) => sum + r.amountUsd, 0),
    blendedApy: blendedApy(rows),
    projectedAnnualUsd: projectedAnnualUsd(rows),
  }
}
