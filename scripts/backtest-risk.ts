/**
 * Forward-outcome backtester for the frozen v1 risk model.
 * Uses dated snapshots only and never changes the v1 scoring formula.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const WINDOWS = [7, 30, 60]
const COLLAPSE_THRESHOLD = -0.5

type SnapshotPool = {
  poolId: string
  tvlUsd: number
  score: number
  grade: string
  scoreBreakdown?: {
    liquidity: number
    stability: number
    sustainability: number
    completeness: number
  }
}

type Snapshot = { date: string; capturedAt?: string; pools: SnapshotPool[] }
type Observation = SnapshotPool & { date: string }
type Result = Observation & { targetDate: string; futureTvlUsd: number; tvlChange: number; collapsed: boolean; disappeared: boolean }
type Summary = { n: number; collapseRate: number; disappearanceRate: number; meanTvlChange: number; quintiles: unknown[] }
type BacktestOutput = { modelVersion: string; collapseDefinition: string; snapshots: number; dateRange: string[]; windows: Record<string, Summary | null> }

function loadSnapshots(): Snapshot[] {
  const dir = join(process.cwd(), 'data', 'grades')
  return readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Snapshot)
}

function summarize(results: Result[]): Summary | null {
  if (!results.length) return null
  const collapseRate = results.filter((r) => r.collapsed).length / results.length
  const disappearanceRate = results.filter((r) => r.disappeared).length / results.length
  const meanChange = results.reduce((s, r) => s + r.tvlChange, 0) / results.length
  const byScore = [...results].sort((a, b) => a.score - b.score)
  const q = Math.max(1, Math.floor(byScore.length / 5))
  const quintiles = Array.from({ length: 5 }, (_, i) => {
    const start = i * q
    const end = i === 4 ? byScore.length : (i + 1) * q
    const slice = byScore.slice(start, end)
    return { quintile: i + 1, n: slice.length, avgScore: slice.reduce((s, r) => s + r.score, 0) / slice.length, collapseRate: slice.filter((r) => r.collapsed).length / slice.length, disappearanceRate: slice.filter((r) => r.disappeared).length / slice.length, meanTvlChange: slice.reduce((s, r) => s + r.tvlChange, 0) / slice.length }
  })
  return { n: results.length, collapseRate, disappearanceRate, meanTvlChange: meanChange, quintiles }
}

function main() {
  const snapshots = loadSnapshots()
  if (snapshots.length < 2) {
    console.log(JSON.stringify({ error: 'Need at least two dated snapshots.' }, null, 2))
    return
  }
  const observations: Observation[] = snapshots.flatMap((s) => s.pools.filter((p) => Number.isFinite(p.tvlUsd) && p.tvlUsd > 0).map((p) => ({ ...p, date: s.date })))
  const output: BacktestOutput = { modelVersion: 'v1', collapseDefinition: `future TVL <= ${COLLAPSE_THRESHOLD * 100}% from baseline`, snapshots: snapshots.length, dateRange: [snapshots[0].date, snapshots[snapshots.length - 1].date], windows: {} }
  for (const days of WINDOWS) {
    const results: Result[] = []
    for (const obs of observations) {
      const target = Date.parse(obs.date) + days * 86400_000
      const futureSnapshot = snapshots.find((s) => Date.parse(s.date) >= target)
      if (!futureSnapshot) continue
      const future = futureSnapshot.pools.find((p) => p.poolId === obs.poolId)
      if (!future) {
        results.push({ ...obs, targetDate: futureSnapshot.date, futureTvlUsd: 0, tvlChange: -1, collapsed: true, disappeared: true })
        continue
      }
      const tvlChange = future.tvlUsd / obs.tvlUsd - 1
      results.push({ ...obs, targetDate: futureSnapshot.date, futureTvlUsd: future.tvlUsd, tvlChange, collapsed: tvlChange <= COLLAPSE_THRESHOLD, disappeared: false })
    }
    output.windows[String(days)] = summarize(results)
  }
  console.log(JSON.stringify(output, null, 2))
}
main()
