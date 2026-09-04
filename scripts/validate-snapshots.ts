/**
 * Data-quality validator for the public grade ledger.
 * -----------------------------------------------------
 * Flags DATA GLITCHES in data/grades/<date>.json — transient, physically
 * implausible TVL readings from the upstream feed that wrongly move a grade.
 *
 * DESIGN PRINCIPLE (important): a glitch is NOT a bad outcome. A real TVL
 * collapse — a pool that drops and STAYS down — is the harm signal we exist to
 * study, so we must never mark it ineligible. We only flag readings that are
 * physically impossible or that spike and immediately revert. Concretely, a
 * pool-observation at snapshot t is a glitch if EITHER:
 *
 *   (a) OVER CEILING:    tvl[t] > CEILING. Nothing in this dataset legitimately
 *       exceeds Lido stETH (~$23.7B); a value above that is a bad feed.
 *   (b) TRANSIENT PEAK:  tvl[t] >= PEAK_MULT × both neighbours (t-1 AND t+1),
 *       with tvl[t] >= PEAK_ABS_FLOOR. A missing neighbour counts as ~0, so a
 *       spike that then vanishes still qualifies. Sustained growth (a real pool
 *       launch that persists) and genuine collapses are NOT peaks.
 *
 * This is a RETROSPECTIVE validator: the transient-peak test needs the *next*
 * snapshot, which does not exist at write time. The live pipeline
 * (snapshot-grades.ts) can only run the single-snapshot tripwire — the ceiling
 * check, plus an optional jump-vs-previous flag — and mark a pool for review.
 * Final classification happens here, one week later, once the neighbour exists.
 *
 * We do NOT rewrite historical snapshots. The ledger stays append-only; this
 * tool reports which observations to exclude from analysis (backtests), leaving
 * the raw record intact.
 *
 * Run: npx tsx scripts/validate-snapshots.ts
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const DIR = join(process.cwd(), 'data', 'grades')

// Thresholds are data-driven (see the TVL distribution across all snapshots).
export const CEILING = 24e9 // > legit max (Lido stETH ~$23.7B)
export const PEAK_MULT = 3 // peak must be >= 3x both temporal neighbours
export const PEAK_ABS_FLOOR = 100e6 // and >= $100M to matter to the grade

export type Pool = {
  poolId: string
  project: string
  chain: string
  symbol: string
  apy: number
  tvlUsd: number
  grade: string
  score: number
}
export type Snapshot = { date: string; t: number; pools: Pool[]; map: Map<string, Pool> }
export type Flag = { date: string; poolId: string; project: string; symbol: string; grade: string; score: number; tvl: number; reason: string }

export function loadSnapshots(dir = DIR): Snapshot[] {
  const files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
  return files.map((f) => {
    const j = JSON.parse(readFileSync(join(dir, f), 'utf8')) as { date?: string; pools?: Pool[] }
    const date = j.date || f.replace('.json', '')
    const map = new Map<string, Pool>()
    for (const p of j.pools ?? []) if (p.poolId) map.set(p.poolId, p)
    return { date, t: Date.parse(date), pools: j.pools ?? [], map }
  })
}

/** Returns the set of glitch keys `${date}|${poolId}` plus a detailed flag list. */
export function flagGlitches(snaps: Snapshot[]): { flagged: Flag[]; keys: Set<string> } {
  const flagged: Flag[] = []
  const keys = new Set<string>()
  for (let i = 0; i < snaps.length; i++) {
    const cur = snaps[i]
    const prev = snaps[i - 1]
    const nxt = snaps[i + 1]
    for (const p of cur.pools) {
      const tvl = p.tvlUsd
      if (!(tvl > 0)) continue
      let reason: string | null = null
      if (tvl > CEILING) reason = `over-ceiling ($${(tvl / 1e9).toFixed(1)}B > $${CEILING / 1e9}B)`
      if (!reason && prev && nxt && tvl >= PEAK_ABS_FLOOR) {
        const prevTvl = prev.map.get(p.poolId)?.tvlUsd ?? 0
        const nextTvl = nxt.map.get(p.poolId)?.tvlUsd ?? 0
        if (tvl >= PEAK_MULT * Math.max(prevTvl, 1) && tvl >= PEAK_MULT * Math.max(nextTvl, 1)) {
          reason = `transient peak (prev=$${(prevTvl / 1e6).toFixed(1)}M, peak=$${(tvl / 1e6).toFixed(1)}M, next=$${(nextTvl / 1e6).toFixed(1)}M)`
        }
      }
      if (reason) {
        flagged.push({ date: cur.date, poolId: p.poolId, project: p.project, symbol: p.symbol, grade: p.grade, score: p.score, tvl, reason })
        keys.add(`${cur.date}|${p.poolId}`)
      }
    }
  }
  return { flagged, keys }
}

/** Single-snapshot tripwire for the LIVE pipeline (no future data available). */
export function tripwire(p: Pool, prev?: Snapshot): string | null {
  if (p.tvlUsd > CEILING) return `over-ceiling ($${(p.tvlUsd / 1e9).toFixed(1)}B)`
  if (prev && p.tvlUsd >= PEAK_ABS_FLOOR) {
    const prevTvl = prev.map.get(p.poolId)?.tvlUsd ?? 0
    if (p.tvlUsd >= 10 * Math.max(prevTvl, 1)) return `suspected spike (prev=$${(prevTvl / 1e6).toFixed(1)}M -> $${(p.tvlUsd / 1e6).toFixed(1)}M) — confirm next week`
  }
  return null
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const snaps = loadSnapshots()
  const { flagged } = flagGlitches(snaps)
  const total = snaps.reduce((s, x) => s + x.pools.length, 0)
  console.log(`snapshots: ${snaps.length} (${snaps[0]?.date} -> ${snaps[snaps.length - 1]?.date})`)
  console.log(`total observations: ${total}`)
  console.log(`flagged glitches: ${flagged.length} (${((flagged.length / total) * 100).toFixed(4)}%)`)
  for (const f of flagged.sort((a, b) => b.tvl - a.tvl)) {
    console.log(`  ${f.date}  ${f.grade}/${f.score}  ${f.project} ${f.symbol}  $${(f.tvl / 1e9).toFixed(3)}B  [${f.reason}]`)
  }
}
