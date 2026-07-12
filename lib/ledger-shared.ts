/**
 * Client-safe ledger types and constants (no node:fs).
 * The fs-reading aggregation lives in lib/ledger.ts (server only).
 */

export const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'F'] as const
export type GradeLetter = (typeof GRADE_LETTERS)[number]
export type GradeDistribution = Record<GradeLetter, number>

export const LEDGER_REPO_URL = 'https://github.com/EchoPrism44/quickyield-scanner/tree/main/data/grades'
export const LEDGER_BLOB_BASE = 'https://github.com/EchoPrism44/quickyield-scanner/blob/main/data/grades'

export type LedgerSnapshotSummary = {
  date: string
  count: number
  dist: GradeDistribution
  chains: number
  githubUrl: string
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
