import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Public grade ledger — server-side aggregation.
 *
 * Every Monday a GitHub Action grades all live pools and commits
 * `data/grades/<YYYY-MM-DD>.json` (~5k pools each). These files are the
 * product's public track record. This module reduces them to a few hundred
 * bytes of summary data for the marketing surfaces (landing hero, /proof),
 * so raw snapshots are never shipped to the client.
 *
 * Node `fs` only — call from server components / build time. Fails soft to
 * `null` so pages render a static fallback if the ledger is missing.
 */

export const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'F'] as const
export type GradeLetter = (typeof GRADE_LETTERS)[number]
export type GradeDistribution = Record<GradeLetter, number>

export const LEDGER_REPO_URL = 'https://github.com/EchoPrism44/quickyield-scanner/tree/main/data/grades'
const LEDGER_BLOB_BASE = 'https://github.com/EchoPrism44/quickyield-scanner/blob/main/data/grades'

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

type RawSnapshot = {
  date: string
  count: number
  pools: Array<{ grade: string; chain?: string }>
}

function emptyDistribution(): GradeDistribution {
  return { A: 0, B: 0, C: 0, D: 0, F: 0 }
}

function isGradeLetter(g: string): g is GradeLetter {
  return (GRADE_LETTERS as readonly string[]).includes(g)
}

function summarize(raw: RawSnapshot, file: string): LedgerSnapshotSummary {
  const dist = emptyDistribution()
  const chains = new Set<string>()
  for (const pool of raw.pools) {
    if (isGradeLetter(pool.grade)) dist[pool.grade] += 1
    if (pool.chain) chains.add(pool.chain)
  }
  return {
    date: raw.date ?? file.replace(/\.json$/, ''),
    count: raw.count ?? raw.pools.length,
    dist,
    chains: chains.size,
    githubUrl: `${LEDGER_BLOB_BASE}/${file}`,
  }
}

export function getLedgerSummary(dir = join(process.cwd(), 'data', 'grades')): LedgerSummary | null {
  try {
    const files = readdirSync(dir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
    if (files.length === 0) return null

    const snapshots = files.map((file) => {
      const raw = JSON.parse(readFileSync(join(dir, file), 'utf8')) as RawSnapshot
      return summarize(raw, file)
    })

    return {
      snapshots,
      latest: snapshots[snapshots.length - 1],
      totals: {
        snapshotCount: snapshots.length,
        firstDate: snapshots[0].date,
        poolsGradedCumulative: snapshots.reduce((sum, s) => sum + s.count, 0),
      },
    }
  } catch {
    return null
  }
}
