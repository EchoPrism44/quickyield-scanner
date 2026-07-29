import fs from 'node:fs'
import path from 'node:path'

/**
 * Week-over-week snapshot diff engine. Shared by scripts/analyze-snapshot.ts
 * (the CLI research tool behind weekly blog posts) and the terminal's Market
 * Pulse strip (lib/dashboard.ts). Node `fs` only — server-side use only.
 */

export type SnapshotPool = {
  poolId: string
  project: string
  chain: string
  symbol: string
  apy: number
  tvlUsd: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
}

export type Snapshot = { date: string; count: number; pools: SnapshotPool[] }

export const GRADES = ['A', 'B', 'C', 'D', 'F'] as const
const GRADE_RANK: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 }
const GRADES_DIR = path.join(process.cwd(), 'data', 'grades')

export function loadSnapshot(date: string, dir = GRADES_DIR): Snapshot {
  return JSON.parse(fs.readFileSync(path.join(dir, `${date}.json`), 'utf8'))
}

/** Sorted (ascending) snapshot dates found in `dir`, e.g. ["2026-07-13", "2026-07-20"]. */
export function listSnapshotDates(dir = GRADES_DIR): string[] {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort()
  } catch {
    return []
  }
}

export function fmtTvl(v: number) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  return `$${Math.round(v).toLocaleString()}`
}

export function dist(snap: Snapshot) {
  const d: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  for (const p of snap.pools) d[p.grade] = (d[p.grade] ?? 0) + 1
  return d
}

export function safeShare(d: Record<string, number>, total: number) {
  return total ? Math.round(((d.A + d.B) / total) * 100) : 0
}

export function label(p: SnapshotPool) {
  return `${p.project} ${p.symbol} (${p.chain})`
}

export function analyze(prev: Snapshot, curr: Snapshot) {
  const prevById = new Map(prev.pools.map((p) => [p.poolId, p]))
  const currById = new Map(curr.pools.map((p) => [p.poolId, p]))

  const upgraded: { pool: SnapshotPool; from: string }[] = []
  const downgraded: { pool: SnapshotPool; from: string }[] = []
  const apyMovers: { pool: SnapshotPool; delta: number }[] = []
  const tvlMovers: { pool: SnapshotPool; deltaPct: number; prevTvl: number }[] = []

  for (const p of curr.pools) {
    const old = prevById.get(p.poolId)
    if (!old) continue
    if (GRADE_RANK[p.grade] > GRADE_RANK[old.grade]) upgraded.push({ pool: p, from: old.grade })
    if (GRADE_RANK[p.grade] < GRADE_RANK[old.grade]) downgraded.push({ pool: p, from: old.grade })
    apyMovers.push({ pool: p, delta: p.apy - old.apy })
    if (old.tvlUsd > 1e6) tvlMovers.push({ pool: p, deltaPct: ((p.tvlUsd - old.tvlUsd) / old.tvlUsd) * 100, prevTvl: old.tvlUsd })
  }

  const entered = curr.pools.filter((p) => !prevById.has(p.poolId))
  const left = prev.pools.filter((p) => !currById.has(p.poolId))

  const jump = (x: { pool: SnapshotPool; from: string }) => Math.abs(GRADE_RANK[x.pool.grade] - GRADE_RANK[x.from])
  upgraded.sort((a, b) => jump(b) - jump(a) || b.pool.tvlUsd - a.pool.tvlUsd)
  downgraded.sort((a, b) => jump(b) - jump(a) || b.pool.tvlUsd - a.pool.tvlUsd)
  apyMovers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  tvlMovers.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))

  return {
    prevDate: prev.date, currDate: curr.date,
    prevCount: prev.count, currCount: curr.count,
    prevDist: dist(prev), currDist: dist(curr),
    upgraded, downgraded, entered, left,
    apyMovers: apyMovers.slice(0, 8),
    tvlMovers: tvlMovers.slice(0, 8),
  }
}

export type Analysis = ReturnType<typeof analyze>

export type ChainStat = { chain: string; count: number; safe: number; safePct: number }

/** Per-chain counts + safe-share (A|B) for one snapshot, sorted by pool count. */
export function chainBreakdown(snap: Snapshot): ChainStat[] {
  const m = new Map<string, { count: number; safe: number }>()
  for (const p of snap.pools) {
    const e = m.get(p.chain) ?? { count: 0, safe: 0 }
    e.count += 1
    if (p.grade === 'A' || p.grade === 'B') e.safe += 1
    m.set(p.chain, e)
  }
  return [...m.entries()]
    .map(([chain, e]) => ({ chain, count: e.count, safe: e.safe, safePct: e.count ? Math.round((e.safe / e.count) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
}

export type ProtocolStat = { project: string; count: number; safe: number; aCount: number }

/** Protocols ranked by number of graded pools, with their safe (A|B) and A counts. */
export function topProtocols(snap: Snapshot, limit = 10): ProtocolStat[] {
  const m = new Map<string, { count: number; safe: number; aCount: number }>()
  for (const p of snap.pools) {
    const e = m.get(p.project) ?? { count: 0, safe: 0, aCount: 0 }
    e.count += 1
    if (p.grade === 'A' || p.grade === 'B') e.safe += 1
    if (p.grade === 'A') e.aCount += 1
    m.set(p.project, e)
  }
  return [...m.entries()]
    .map(([project, e]) => ({ project, ...e }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export type WeekOverWeekDelta = {
  prevDate: string
  currDate: string
  prevCount: number
  currCount: number
  poolsDelta: number
  upgradedCount: number
  downgradedCount: number
  enteredCount: number
  leftCount: number
  safeSharePrev: number
  safeShareCurr: number
}

/**
 * Aggregate-only week-over-week summary for UI (no per-pool arrays — keeps
 * the payload sent to the client small). Reads the last two snapshots in
 * `dir`. Returns null if fewer than two snapshots exist yet (soft-fail, same
 * convention as lib/ledger.ts's getLedgerSummary).
 */
export function getWeekOverWeekDelta(dir = GRADES_DIR): WeekOverWeekDelta | null {
  try {
    const dates = listSnapshotDates(dir)
    if (dates.length < 2) return null
    const [prevDate, currDate] = dates.slice(-2)
    const a = analyze(loadSnapshot(prevDate, dir), loadSnapshot(currDate, dir))
    return {
      prevDate: a.prevDate,
      currDate: a.currDate,
      prevCount: a.prevCount,
      currCount: a.currCount,
      poolsDelta: a.currCount - a.prevCount,
      upgradedCount: a.upgraded.length,
      downgradedCount: a.downgraded.length,
      enteredCount: a.entered.length,
      leftCount: a.left.length,
      safeSharePrev: safeShare(a.prevDist, a.prevCount),
      safeShareCurr: safeShare(a.currDist, a.currCount),
    }
  } catch {
    return null
  }
}
