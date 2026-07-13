/**
 * Client-safe ledger types and constants (no node:fs).
 * The fs-reading aggregation lives in lib/ledger.ts (server only).
 */

export const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'F'] as const
export type GradeLetter = (typeof GRADE_LETTERS)[number]
export type GradeDistribution = Record<GradeLetter, number>

/**
 * Public data-only ledger repo (weekly JSON snapshots only — NOT the app
 * source). Leave null until that repo exists; when set, the /proof and hero
 * surfaces additionally show a "verify on GitHub" link. The app source repo
 * stays private either way.
 */
export const LEDGER_REPO_URL = null as string | null
const LEDGER_BLOB_BASE = LEDGER_REPO_URL ? `${LEDGER_REPO_URL.replace(/\/tree\/.*$/, '')}/blob/main` : null

/** In-app raw JSON for a snapshot (served by app/api/ledger/[date]). */
export function snapshotDataUrl(date: string): string {
  return `/api/ledger/${date}`
}

/** Public-repo URL for a snapshot, or null until the data-only repo exists. */
export function snapshotRepoUrl(date: string): string | null {
  return LEDGER_BLOB_BASE ? `${LEDGER_BLOB_BASE}/${date}.json` : null
}

export type LedgerSnapshotSummary = {
  date: string
  count: number
  dist: GradeDistribution
  chains: number
  dataUrl: string
  repoUrl: string | null
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
