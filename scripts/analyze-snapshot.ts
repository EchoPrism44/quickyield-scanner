/**
 * Week-over-week snapshot analysis — the research step behind each weekly
 * blog post. Compares the two most recent data/grades/<date>.json files
 * (or two dates passed as args) and reports:
 *   - grade distribution shift
 *   - pools upgraded / downgraded (with the biggest grade jumps)
 *   - biggest APY and TVL movers among graded pools
 *   - pools that entered / left the graded set
 *
 * Usage:
 *   npx tsx scripts/analyze-snapshot.ts                 # latest two
 *   npx tsx scripts/analyze-snapshot.ts 2026-07-13 2026-07-20
 *   npx tsx scripts/analyze-snapshot.ts --draft         # also write a blog draft
 */
import fs from 'node:fs'
import path from 'node:path'

type SnapshotPool = {
  poolId: string
  project: string
  chain: string
  symbol: string
  apy: number
  tvlUsd: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
}

type Snapshot = { date: string; count: number; pools: SnapshotPool[] }

const GRADES = ['A', 'B', 'C', 'D', 'F'] as const
const GRADE_RANK: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 }
const GRADES_DIR = path.join(process.cwd(), 'data', 'grades')

function loadSnapshot(date: string): Snapshot {
  return JSON.parse(fs.readFileSync(path.join(GRADES_DIR, `${date}.json`), 'utf8'))
}

function fmtTvl(v: number) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  return `$${Math.round(v).toLocaleString()}`
}

function dist(snap: Snapshot) {
  const d: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  for (const p of snap.pools) d[p.grade] = (d[p.grade] ?? 0) + 1
  return d
}

function label(p: SnapshotPool) {
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

type Analysis = ReturnType<typeof analyze>

function safeShare(d: Record<string, number>, total: number) {
  return total ? Math.round(((d.A + d.B) / total) * 100) : 0
}

function report(a: Analysis): string {
  const lines: string[] = []
  lines.push(`WEEK-OVER-WEEK: ${a.prevDate} -> ${a.currDate}`)
  lines.push('')
  lines.push(`Pools graded: ${a.prevCount} -> ${a.currCount} (${a.currCount - a.prevCount >= 0 ? '+' : ''}${a.currCount - a.prevCount})`)
  lines.push(`Safe share (A+B): ${safeShare(a.prevDist, a.prevCount)}% -> ${safeShare(a.currDist, a.currCount)}%`)
  lines.push('')
  lines.push('Grade distribution:')
  for (const g of GRADES) {
    const delta = a.currDist[g] - a.prevDist[g]
    lines.push(`  ${g}: ${a.prevDist[g]} -> ${a.currDist[g]} (${delta >= 0 ? '+' : ''}${delta})`)
  }
  lines.push('')
  lines.push(`Upgraded: ${a.upgraded.length} pools. Top:`)
  for (const u of a.upgraded.slice(0, 8)) lines.push(`  ${u.from} -> ${u.pool.grade}  ${label(u.pool)}  APY ${u.pool.apy.toFixed(2)}%  TVL ${fmtTvl(u.pool.tvlUsd)}`)
  lines.push('')
  lines.push(`Downgraded: ${a.downgraded.length} pools. Top:`)
  for (const d of a.downgraded.slice(0, 8)) lines.push(`  ${d.from} -> ${d.pool.grade}  ${label(d.pool)}  APY ${d.pool.apy.toFixed(2)}%  TVL ${fmtTvl(d.pool.tvlUsd)}`)
  lines.push('')
  lines.push('Biggest APY moves (same pool, week over week):')
  for (const m of a.apyMovers) lines.push(`  ${m.delta >= 0 ? '+' : ''}${m.delta.toFixed(2)}pp  ${label(m.pool)}  now ${m.pool.apy.toFixed(2)}%  [${m.pool.grade}]`)
  lines.push('')
  lines.push('Biggest TVL moves (pools > $1M):')
  for (const m of a.tvlMovers) lines.push(`  ${m.deltaPct >= 0 ? '+' : ''}${m.deltaPct.toFixed(1)}%  ${label(m.pool)}  ${fmtTvl(m.prevTvl)} -> ${fmtTvl(m.pool.tvlUsd)}  [${m.pool.grade}]`)
  lines.push('')
  lines.push(`Entered the graded set: ${a.entered.length} · Left the set: ${a.left.length}`)
  return lines.join('\n')
}

function draftPost(a: Analysis): string {
  const up = a.upgraded.length
  const down = a.downgraded.length
  const tone = up > down ? 'a net-positive week' : down > up ? 'a cautious week' : 'a steady week'
  const topUp = a.upgraded[0]
  const topDown = a.downgraded[0]
  const dGrid = GRADES.map((g) => `| ${g} | ${a.prevDist[g]} | ${a.currDist[g]} | ${a.currDist[g] - a.prevDist[g] >= 0 ? '+' : ''}${a.currDist[g] - a.prevDist[g]} |`).join('\n')

  return `---
title: "Weekly grade record — ${a.currDate}"
date: "${a.currDate}"
excerpt: "${a.currCount.toLocaleString()} pools graded: ${up} upgraded, ${down} downgraded — ${tone} for onchain yield."
author: "Vivek"
readMinutes: 4
---

Every Monday we grade every live pool on the feed and publish the record. Here is what changed between **${a.prevDate}** and **${a.currDate}**.

## The week at a glance

- **${a.currCount.toLocaleString()} pools graded** (${a.currCount - a.prevCount >= 0 ? '+' : ''}${a.currCount - a.prevCount} vs last week)
- **${up} pools upgraded**, **${down} downgraded** — ${tone}
- **Safe share (A or B): ${safeShare(a.currDist, a.currCount)}%** (was ${safeShare(a.prevDist, a.prevCount)}%)

## Grade distribution

| Grade | Last week | This week | Change |
|---|---|---|---|
${dGrid}

## Notable moves

${topUp ? `**Biggest upgrade:** ${label(topUp.pool)} moved ${topUp.from} → ${topUp.pool.grade} (APY ${topUp.pool.apy.toFixed(2)}%, TVL ${fmtTvl(topUp.pool.tvlUsd)}).` : ''}

${topDown ? `**Biggest downgrade:** ${label(topDown.pool)} moved ${topDown.from} → ${topDown.pool.grade} (APY ${topDown.pool.apy.toFixed(2)}%, TVL ${fmtTvl(topDown.pool.tvlUsd)}).` : ''}

## Our read

(Write your take here: why did these pools move? Is the market getting safer or riskier? What should readers watch next week? Delete this placeholder before publishing.)

## Method note

Grades are recomputed weekly from public data under our published methodology and recorded before outcomes are known. They are descriptive research, not investment advice.
`
}

// --- main ---
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const wantDraft = process.argv.includes('--draft')
const dates = fs.readdirSync(GRADES_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort()
const [prevDate, currDate] = args.length === 2 ? args : dates.slice(-2)
if (!prevDate || !currDate) {
  console.error('Need at least two snapshots in data/grades/')
  process.exit(1)
}

const a = analyze(loadSnapshot(prevDate), loadSnapshot(currDate))
console.log(report(a))

if (wantDraft) {
  const outDir = path.join(process.cwd(), 'content', 'blog')
  fs.mkdirSync(outDir, { recursive: true })
  const out = path.join(outDir, `${a.currDate}-weekly-grade-record.md`)
  fs.writeFileSync(out, draftPost(a))
  console.log(`\nDraft written: ${out}`)
}
