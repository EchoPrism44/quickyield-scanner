/**
 * Client-safe ledger types and constants (no node:fs).
 * The fs-reading aggregation lives in lib/ledger.ts (server only).
 */

export const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'F'] as const
export type GradeLetter = (typeof GRADE_LETTERS)[number]
export type GradeDistribution = Record<GradeLetter, number>

/**
 * Machine-readable raw JSON for a snapshot (served by app/api/ledger/[date]).
 * Layer 1 (developer/machine access) — intentionally NOT linked in the UI.
 * Users see charts + the on-chain (Base) verification, never raw JSON.
 */
export function snapshotDataUrl(date: string): string {
  return `/api/ledger/${date}`
}

export type LedgerSnapshotSummary = {
  date: string
  count: number
  dist: GradeDistribution
  chains: number
  dataUrl: string
}

export type LedgerSummary = {
  snapshots: LedgerSnapshotSummary[] // ascending by date
  latest: LedgerSnapshotSummary
  totals: {
    snapshotCount: number
    firstDate: string
    poolsGradedCumulative: number
  }
}
