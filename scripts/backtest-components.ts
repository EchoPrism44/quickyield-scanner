/**
 * Component and baseline comparison for the frozen v1 risk model.
 *
 * Forward targets use a tolerance window around 7/30/60 days. We select the
 * snapshot whose date is closest to the target, provided it is within the
 * configured tolerance. This avoids silently turning a 30-day test into a
 * 35-day test just because snapshots are weekly.
 *
 * Reports rank correlation, collapse-rate separation, top/bottom deciles and
 * bootstrap confidence intervals for the collapse-rate difference.
 *
 * This intentionally does not tune weights. It is an evidence report.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const WINDOWS = [7, 30, 60]
const TOLERANCE_DAYS = 4
const COLLAPSE_THRESHOLD = -0.5
const BOOTSTRAPS = 2000

type Pool = {
  poolId: string
  tvlUsd: number
  apy: number
  score: number
  scoreBreakdown?: Record<string, number>
}
type Snapshot = { date: string; pools: Pool[] }
type Obs = Pool & { date: string }
type Result = Obs & { futureDate: string; actualDays: number; futureTvl: number; tvlChange: number; collapsed: boolean }

const metrics = ['tvlUsd', 'apy', 'liquidity', 'stability', 'sustainability', 'completeness', 'score'] as const

type Metric = typeof metrics[number]

function load(): Snapshot[] {
  const dir = join(process.cwd(), 'data', 'grades')
  return readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
    .map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Snapshot)
}

function value(o: Obs, metric: Metric) {
  if (['liquidity', 'stability', 'sustainability', 'completeness'].includes(metric)) return o.scoreBreakdown?.[metric]
  return o[metric]
}

function rankCorrelation(xs: number[], ys: number[]) {
  if (xs.length < 2) return null
  const rank = (a: number[]) => {
    const order = a.map((v, i) => [v, i] as const).sort((x, y) => x[0] - y[0])
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

function quantile(sorted: number[], p: number) {
  if (!sorted.length) return null
  const i = (sorted.length - 1) * p
  const lo = Math.floor(i), hi = Math.ceil(i)
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo)
}

function bootstrapDiff(a: boolean[], b: boolean[]) {
  if (!a.length || !b.length) return null
  const diffs: number[] = []
  for (let k = 0; k < BOOTSTRAPS; k++) {
    let sa = 0, sb = 0
    for (let i = 0; i < a.length; i++) sa += a[Math.floor(Math.random() * a.length)] ? 1 : 0
    for (let i = 0; i < b.length; i++) sb += b[Math.floor(Math.random() * b.length)] ? 1 : 0
    diffs.push(sa / a.length - sb / b.length)
  }
  diffs.sort((x, y) => x - y)
  return {
    difference: a.filter(Boolean).length / a.length - b.filter(Boolean).length / b.length,
    ci95: [quantile(diffs, 0.025), quantile(diffs, 0.975)],
  }
}

function evaluate(results: Result[], metric: Metric) {
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
  const decileN = Math.max(1, Math.floor(ordered.length / 10))
  const bottom = ordered.slice(0, decileN)
  const top = ordered.slice(-decileN)
  const topBottom = {
    bottomN: bottom.length,
    topN: top.length,
    bottomCollapseRate: bottom.filter(r => r.collapsed).length / bottom.length,
    topCollapseRate: top.filter(r => r.collapsed).length / top.length,
    collapseRateDifference: bottom.filter(r => r.collapsed).length / bottom.length - top.filter(r => r.collapsed).length / top.length,
    bootstrap95: bootstrapDiff(bottom.map(r => r.collapsed), top.map(r => r.collapsed)),
  }
  return { n: usable.length, spearmanRho: rho, quintiles, topBottomDecile: topBottom }
}

function findFutureSnapshot(snapshots: Snapshot[], obsDate: string, days: number) {
  const target = Date.parse(obsDate) + days * 86400_000
  let best: Snapshot | undefined
  let bestDistance = Infinity
  for (const s of snapshots) {
    const delta = Date.parse(s.date) - target
    if (delta < -TOLERANCE_DAYS * 86400_000 || delta > TOLERANCE_DAYS * 86400_000) continue
    const distance = Math.abs(delta)
    if (distance < bestDistance) {
      best = s
      bestDistance = distance
    }
  }
  return best
}

function main() {
  const snapshots = load()
  const observations: Obs[] = snapshots.flatMap(s => s.pools.filter(p => p.tvlUsd > 0).map(p => ({ ...p, date: s.date })))
  const output: Record<string, unknown> = {
    modelVersion: 'v1',
    collapseDefinition: 'future TVL decline >= 50%',
    targetToleranceDays: TOLERANCE_DAYS,
    bootstrapReplicates: BOOTSTRAPS,
    windows: {},
  }

  for (const days of WINDOWS) {
    const results: Result[] = []
    for (const obs of observations) {
      const futureSnapshot = findFutureSnapshot(snapshots, obs.date, days)
      if (!futureSnapshot) continue
      const future = futureSnapshot.pools.find(p => p.poolId === obs.poolId)
      if (!future) continue
      const actualDays = (Date.parse(futureSnapshot.date) - Date.parse(obs.date)) / 86400_000
      const tvlChange = future.tvlUsd / obs.tvlUsd - 1
      results.push({ ...obs, futureDate: futureSnapshot.date, actualDays, futureTvl: future.tvlUsd, tvlChange, collapsed: tvlChange <= COLLAPSE_THRESHOLD })
    }
    output.windows[String(days)] = {
      targetDays: days,
      actualHorizon: results.length ? {
        minDays: Math.min(...results.map(r => r.actualDays)),
        maxDays: Math.max(...results.map(r => r.actualDays)),
        meanDays: results.reduce((s, r) => s + r.actualDays, 0) / results.length,
      } : null,
      metrics: Object.fromEntries(metrics.map(m => [m, evaluate(results, m)])),
    }
  }
  console.log(JSON.stringify(output, null, 2))
}
main()
