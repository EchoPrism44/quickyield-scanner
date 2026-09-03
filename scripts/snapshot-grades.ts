/**
 * Public grade ledger — Option 1 (the forward proof).
 *
 * Grades every live DeFiLlama pool with the production model and writes a dated
 * snapshot to data/grades/<YYYY-MM-DD>.json. A weekly GitHub Action commits this
 * to the repo, so the git history becomes a public record of what the model said
 * before the future outcome was known.
 *
 * IMPORTANT: Each snapshot persists the four component scores as well as the
 * composite score. This is required for component-level backtesting later.
 *
 * Run: npx tsx scripts/snapshot-grades.ts
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { computeScoreBreakdown } from '../lib/scoring'
import { computeSafetyGrade } from '../lib/grade'

type LlamaPool = {
  pool: string
  project: string
  chain: string
  symbol: string
  tvlUsd: number
  apy?: number
  apyBase?: number
  apyReward?: number
  apyPct1D?: number
  apyMean30d?: number
}

type StoredPool = {
  poolId: string
  tvlUsd: number
}

type StoredSnapshot = {
  date: string
  pools: StoredPool[]
}

const num = (v: number | undefined | null) => (v === undefined || v === null ? undefined : Number(v))

// A genuine pool can move sharply, so this is deliberately a flag rather than
// an automatic deletion. Extreme one-week moves are excluded from downstream
// analysis until verified. This catches source/decimal/metadata errors without
// destroying the raw observation in the public ledger.
const TVL_SPIKE_MULTIPLIER = 20
const TVL_COLLAPSE_MULTIPLIER = 0.05

function loadPreviousSnapshot(currentDate: string): StoredSnapshot | undefined {
  try {
    const files = readdirSync('data/grades')
      .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .filter((name) => name.slice(0, 10) < currentDate)
      .sort()

    const previous = files.at(-1)
    if (!previous) return undefined

    return JSON.parse(readFileSync(`data/grades/${previous}`, 'utf8')) as StoredSnapshot
  } catch {
    return undefined
  }
}

function tvlQualityFlags(currentTvl: number, previousTvl: number | undefined): string[] {
  if (!Number.isFinite(currentTvl) || currentTvl <= 0 || previousTvl === undefined || previousTvl <= 0) return []

  const ratio = currentTvl / previousTvl
  if (ratio >= TVL_SPIKE_MULTIPLIER) return ['TVL_SPIKE_ANOMALY']
  if (ratio <= TVL_COLLAPSE_MULTIPLIER) return ['TVL_COLLAPSE_ANOMALY']
  return []
}

async function main() {
  const res = await fetch('https://yields.llama.fi/pools', { signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`pools ${res.status}`)
  const data = ((await res.json()) as { data?: LlamaPool[] }).data ?? []

  const capturedAt = new Date().toISOString()
  const date = capturedAt.slice(0, 10)
  const previous = loadPreviousSnapshot(date)
  const previousByPool = new Map((previous?.pools ?? []).map((p) => [p.poolId, Number(p.tvlUsd)]))

  const pools = data
    .filter((p) => Number(p.tvlUsd) >= 100_000 && Number(p.apy ?? 0) > 0 && Number(p.apy ?? 0) <= 100)
    .map((p) => {
      const tvlUsd = Math.round(Number(p.tvlUsd || 0))
      const qualityFlags = tvlQualityFlags(tvlUsd, previousByPool.get(p.pool))
      const apy = Number(p.apy ?? p.apyBase ?? 0)
      const scoreBreakdown = computeScoreBreakdown({
        apy,
        apyBase: num(p.apyBase),
        apyReward: num(p.apyReward),
        apyPct1D: num(p.apyPct1D),
        apyMean30d: num(p.apyMean30d),
        tvl: tvlUsd,
      })
      const grade = computeSafetyGrade(scoreBreakdown)

      return {
        poolId: p.pool,
        project: p.project,
        chain: p.chain,
        symbol: p.symbol,
        apy: Number(apy.toFixed(2)),
        apyBase: num(p.apyBase),
        apyReward: num(p.apyReward),
        apyPct1D: num(p.apyPct1D),
        apyMean30d: num(p.apyMean30d),
        tvlUsd,
        scoreBreakdown,
        grade: grade.letter,
        score: grade.score,
        dataQualityFlags: qualityFlags,
        analysisEligible: qualityFlags.length === 0,
      }
    })
    .sort((a, b) => b.tvlUsd - a.tvlUsd)

  mkdirSync('data/grades', { recursive: true })
  const out = `data/grades/${date}.json`
  writeFileSync(
    out,
    JSON.stringify({
      date,
      capturedAt,
      modelVersion: 'v1',
      count: pools.length,
      dataQuality: {
        validationVersion: 'v1',
        tvlSpikeMultiplier: TVL_SPIKE_MULTIPLIER,
        tvlCollapseMultiplier: TVL_COLLAPSE_MULTIPLIER,
        flaggedPools: pools.filter((p) => p.dataQualityFlags.length > 0).length,
      },
      pools,
    }, null, 0) + '\n',
  )

  const byGrade = pools.reduce<Record<string, number>>((m, p) => ((m[p.grade] = (m[p.grade] ?? 0) + 1), m), {})
  const flagged = pools.filter((p) => p.dataQualityFlags.length > 0)
  console.log(`Wrote ${out} — ${pools.length} pools graded`)
  console.log('  by grade:', ['A', 'B', 'C', 'D', 'F'].map((g) => `${g}:${byGrade[g] ?? 0}`).join('  '))
  console.log(`  data-quality flags: ${flagged.length}`)
  for (const p of flagged) console.log(`    ${p.project} ${p.symbol} ${p.poolId} — ${p.dataQualityFlags.join(', ')}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
