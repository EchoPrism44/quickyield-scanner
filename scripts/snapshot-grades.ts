/**
 * Public grade ledger — Option 1 (the forward proof).
 *
 * Grades every live DeFiLlama pool with the production model and writes a dated
 * snapshot to data/grades/<YYYY-MM-DD>.json. A weekly GitHub Action commits this
 * to the repo, so the git history becomes a tamper-proof public record: every
 * grade has an immutable timestamp. Over 60–90 days this is a real,
 * survivorship-bias-free track record (we recorded each pool BEFORE its outcome).
 *
 * Run: npx tsx scripts/snapshot-grades.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
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

const num = (v: number | undefined | null) => (v === undefined || v === null ? undefined : Number(v))

async function main() {
  const res = await fetch('https://yields.llama.fi/pools', { signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`pools ${res.status}`)
  const data = ((await res.json()) as { data?: LlamaPool[] }).data ?? []

  const pools = data
    .filter((p) => Number(p.tvlUsd) >= 100_000 && Number(p.apy ?? 0) > 0 && Number(p.apy ?? 0) <= 100)
    .map((p) => {
      const apy = Number(p.apy ?? p.apyBase ?? 0)
      const grade = computeSafetyGrade(
        computeScoreBreakdown({
          apy,
          apyBase: num(p.apyBase),
          apyReward: num(p.apyReward),
          apyPct1D: num(p.apyPct1D),
          apyMean30d: num(p.apyMean30d),
          tvl: Number(p.tvlUsd || 0),
        }),
      )
      return {
        poolId: p.pool,
        project: p.project,
        chain: p.chain,
        symbol: p.symbol,
        apy: Number(apy.toFixed(2)),
        tvlUsd: Math.round(Number(p.tvlUsd || 0)),
        grade: grade.letter,
        score: grade.score,
      }
    })
    .sort((a, b) => b.tvlUsd - a.tvlUsd)

  const date = new Date().toISOString().slice(0, 10)
  mkdirSync('data/grades', { recursive: true })
  const out = `data/grades/${date}.json`
  writeFileSync(out, JSON.stringify({ date, count: pools.length, pools }, null, 0) + '\n')

  const byGrade = pools.reduce<Record<string, number>>((m, p) => ((m[p.grade] = (m[p.grade] ?? 0) + 1), m), {})
  console.log(`Wrote ${out} — ${pools.length} pools graded`)
  console.log('  by grade:', ['A', 'B', 'C', 'D', 'F'].map((g) => `${g}:${byGrade[g] ?? 0}`).join('  '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
