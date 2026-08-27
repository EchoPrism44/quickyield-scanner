/**
 * Component and baseline comparison for the frozen v1 risk model.
 *
 * For each forward outcome window, compares:
 *   - TVL baseline
 *   - APY baseline
 *   - each QuickYield component
 *   - composite QuickYield score
 *
 * This intentionally does not tune weights. It is an evidence report.
 *
 * Run: npx tsx scripts/backtest-components.ts
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const WINDOWS = [7, 30, 60]
const COLLAPSE_THRESHOLD = -0.5

type Pool = {
  poolId: string
  tvlUsd: number
  apy: number
  score: number
  scoreBreakdown?: Record<string, number>
}
type Snapshot = { date: string; pools: Pool[] }
type Obs = Pool & { date: string }
type Result = Obs & { futureTvl: number; tvlChange: number; collapsed: boolean }

const metrics = ['tvlUsd', 'apy', 'liquidity', 'stability', 'sustainability', 'completeness', 'score'] as const

function load(): Snapshot[] {
  const dir = join(process.cwd(), 'data', 'grades')
  return readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
    .map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Snapshot)
}

function value(o: Obs, metric: typeof metrics[number]) {
  if (metric === 'liquidity' || metric === 'stability' || metric === 'sustainability' || metric === 'completeness') return o.scoreBreakdown?.[metric]
  return o[metric]
}

function rankCorrelation(xs: number[], ys: number[]) {
  if (xs.length < 2) return null
  const rank = (a: number[]) => {
    const order = a.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0])
    const r = Array(a.length).fill(0) as number[]
    let i = 0
    while (i < order.length) {
      let j = i + 1
      while (j < order.length && order[j][0] === order[i][0]) j++
      const avg = (i + j - 1) / 2 + 1
      for (let k = i; k < j; k++) r[order[k][1]] = avg
      i = j
    }
    return r
  }
  const a = rank(xs), b = rank(ys)
  const ma = a.reduce((s, x) => s + x, 0) / a.length
  const mb = b.reduce((s, x) => s + x, 0) / b.length
  const num = a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0)
  const denA = Math.sqrt(a.reduce((s, x) => s + (x - ma) ** 2, 0))
  const denB = Math.sqrt(b.reduce((s, x) => s + (x - mb) ** 2, 0))
  return denA && denB ? num / (denA * denB) : 0
}

function evaluate(results: Result[], metric: typeof metrics[number]) {
  const usable = results.filter(r => Number.isFinite(value(r, metric)))
  if (!usable.length) return null
  const xs = usable.map(r => Number(value(r, metric)))
  const ys = usable.map(r => r.tvlChange)
  const rho = rankCorrelation(xs, ys)
  const ordered = [...usable].sort((a, b) => Number(value(a, metric)) - Number(value(b, metric)))
  const q = Math.max(1, Math.floor(ordered.length / 5))
  const quintiles = Array.from({ length: 5 }, (_, i) => {
    const slice = ordered.slice(i * q, i === 4 ? undefined : (i + 1) * q)
    return {
      q: i + 1,
      n: slice.length,
      meanValue: slice.reduce((s, r) => s + Number(value(r, metric)), 0) / slice.length,
      collapseRate: slice.filter(r => r.collapsed).length / slice.length,
      meanTvlChange: slice.reduce((s, r) => s + r.tvlChange, 0) / slice.length,
    }
  })
  return { n: usable.length, spearmanRho: rho, quintiles }
}

function main() {
  const snapshots = load()
  const observations: Obs[] = snapshots.flatMap(s => s.pools.filter(p => p.tvlUsd > 0).map(p => ({ ...p, date: s.date })))
  const output: Record<string, unknown> = { modelVersion: 'v1', collapseDefinition: 'future TVL decline >= 50%', windows: {} }

  for (const days of WINDOWS) {
    const results: Result[] = []
    for (const obs of observations) {
      const target = Date.parse(obs.date) + days * 86400_000
      const futureSnapshot = snapshots.find(s => Date.parse(s.date) >= target)
      if (!futureSnapshot) continue
      const future = futureSnapshot.pools.find(p => p.poolId === obs.poolId)
      if (!future) continue
      const tvlChange = future.tvlUsd / obs.tvlUsd - 1
      results.push({ ...obs, futureTvl: future.tvlUsd, tvlChange, collapsed: tvlChange <= COLLAPSE_THRESHOLD })
    }
    output.windows[String(days)] = Object.fromEntries(metrics.map(m => [m, evaluate(results, m)]))
  }
  console.log(JSON.stringify(output, null, 2))
}
main()
