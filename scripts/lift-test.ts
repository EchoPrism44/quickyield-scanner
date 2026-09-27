/**
 * Lift test — does the composite grade earn its non-TVL weight?
 * -------------------------------------------------------------
 * The decisive validation for the current model: once you control for pool size
 * (TVL), do the other three signals (stability, sustainability, completeness)
 * add any independent predictive power over TVL alone?
 *
 * Method (pure Node, no deps so every line is auditable):
 *   - Panel: each snapshot -> first snapshot >= 30 days later; pair pools by id.
 *     Outcome `bad` = pool disappeared OR TVL dropped >= 50% ("collapse").
 *   - AUC via the exact rank / Mann-Whitney identity.
 *   - Combined model via a hand-rolled IRLS logistic regression (TVL + score).
 *   - Stratified check: within TVL bins, compare collapse rates for the
 *     higher-score vs lower-score half; sweep bin counts to rule out the
 *     "wide bins hide a size difference" confound.
 *
 * Verified result on the 14 snapshots (2026-06-11 .. 2026-08-31):
 *   AUC  log(TVL) 0.607 | score 0.531 | TVL+score 0.605  (no lift)
 *   within-bin (badHigh - badLow) ~1.9-2.1 pts, stable from 10 to 80 bins.
 *
 * Run: npx tsx scripts/lift-test.ts
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

type Pool = { poolId: string; tvlUsd: number; score: number }
type Snap = { date: string; t: number; pools: Pool[]; map: Map<string, Pool> }

const DIR = join(process.cwd(), 'data', 'grades')
const W = 30 // day window
const COLLAPSE = -0.5 // >= 50% TVL loss

function load(): Snap[] {
  const files = readdirSync(DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
  return files.map((f) => {
    const j = JSON.parse(readFileSync(join(DIR, f), 'utf8')) as { date?: string; pools?: Pool[] }
    const date = j.date || f.replace('.json', '')
    const map = new Map<string, Pool>()
    for (const p of j.pools ?? []) if (p.poolId) map.set(p.poolId, p)
    return { date, t: Date.parse(date), pools: j.pools ?? [], map }
  })
}

type Row = { logtvl: number; tvl: number; score: number; bad: number }

function buildPanel(snaps: Snap[]): { rows: Row[]; windows: number } {
  const findFuture = (t: number) => snaps.find((s) => s.t >= t + W * 86400000)
  const rows: Row[] = []
  let windows = 0
  for (const s of snaps) {
    const f = findFuture(s.t)
    if (!f || f.date === s.date) continue
    windows++
    for (const p of s.pools) {
      if (!(p.tvlUsd > 0) || typeof p.score !== 'number') continue
      const fp = f.map.get(p.poolId)
      const bad = !fp ? 1 : fp.tvlUsd / p.tvlUsd - 1 <= COLLAPSE ? 1 : 0
      rows.push({ logtvl: Math.log10(p.tvlUsd), tvl: p.tvlUsd, score: p.score, bad })
    }
  }
  return { rows, windows }
}

/** Exact AUC: probability a higher `pred` corresponds to label 1 (tie-corrected). */
export function auc(preds: number[], ys: number[]): number {
  const a = preds.map((p, i) => ({ p, y: ys[i] })).sort((x, y) => x.p - y.p)
  const n = a.length
  const rank = new Array<number>(n)
  let i = 0
  while (i < n) {
    let j = i
    while (j + 1 < n && a[j + 1].p === a[i].p) j++
    const r = (i + j) / 2 + 1
    for (let k = i; k <= j; k++) rank[k] = r
    i = j + 1
  }
  let sumPos = 0, nPos = 0, nNeg = 0
  for (let k = 0; k < n; k++) { if (a[k].y === 1) { sumPos += rank[k]; nPos++ } else nNeg++ }
  return (sumPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg)
}

function solve3(A: number[][], g: number[]): number[] {
  const M = A.map((r, i) => [...r, g[i]])
  for (let c = 0; c < 3; c++) {
    let piv = c
    for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r
    ;[M[c], M[piv]] = [M[piv], M[c]]
    const d = M[c][c]
    for (let j = c; j <= 3; j++) M[c][j] /= d
    for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c]; for (let j = c; j <= 3; j++) M[r][j] -= f * M[c][j] }
  }
  return [M[0][3], M[1][3], M[2][3]]
}

/** IRLS logistic regression, 2 standardized features + intercept. */
function irls(X: number[][], y: number[], iters = 30): number[] {
  const n = X.length, k = X[0].length
  const b = new Array(k).fill(0)
  const sig = (z: number) => 1 / (1 + Math.exp(-z))
  for (let it = 0; it < iters; it++) {
    const A = Array.from({ length: k }, () => new Array(k).fill(0))
    const g = new Array(k).fill(0)
    for (let i = 0; i < n; i++) {
      let z = 0
      for (let j = 0; j < k; j++) z += b[j] * X[i][j]
      const p = sig(z), w = Math.max(p * (1 - p), 1e-9)
      for (let a = 0; a < k; a++) { g[a] += (y[i] - p) * X[i][a]; for (let c = 0; c < k; c++) A[a][c] += w * X[i][a] * X[i][c] }
    }
    const d = solve3(A, g)
    for (let j = 0; j < k; j++) b[j] += d[j]
  }
  return b
}

function stratified(rows: Row[], nBins: number) {
  const sorted = [...rows].sort((a, b) => a.logtvl - b.logtvl)
  const per = Math.floor(sorted.length / nBins)
  let perverse = 0, wsum = 0
  const table: { bin: number; n: number; badLow: number; badHigh: number; tvlLow: number; tvlHigh: number }[] = []
  for (let bIdx = 0; bIdx < nBins; bIdx++) {
    const bin = sorted.slice(bIdx * per, bIdx === nBins - 1 ? sorted.length : (bIdx + 1) * per)
    const byScore = [...bin].sort((a, b) => a.score - b.score)
    const half = Math.floor(byScore.length / 2)
    const low = byScore.slice(0, half), high = byScore.slice(half)
    const br = (arr: Row[]) => (arr.reduce((a, r) => a + r.bad, 0) / arr.length) * 100
    const mt = (arr: Row[]) => arr.reduce((a, r) => a + r.tvl, 0) / arr.length
    const badLow = br(low), badHigh = br(high)
    perverse += (badHigh - badLow) * bin.length
    wsum += bin.length
    table.push({ bin: bIdx + 1, n: bin.length, badLow, badHigh, tvlLow: mt(low), tvlHigh: mt(high) })
  }
  return { table, avgPerverse: perverse / wsum }
}

function main() {
  const snaps = load()
  const { rows, windows } = buildPanel(snaps)
  const y = rows.map((r) => r.bad)
  const nBad = y.reduce((a, b) => a + b, 0)
  console.log(`panel: ${rows.length} obs across ${windows} start-windows | base bad-rate ${((nBad / rows.length) * 100).toFixed(1)}%`)

  const aucTvl = auc(rows.map((r) => -r.logtvl), y)
  const aucScore = auc(rows.map((r) => -r.score), y)
  const mean = (a: number[]) => a.reduce((x, z) => x + z, 0) / a.length
  const sd = (a: number[], m: number) => Math.sqrt(mean(a.map((z) => (z - m) ** 2)))
  const lt = rows.map((r) => r.logtvl), sc = rows.map((r) => r.score)
  const ltm = mean(lt), ltsd = sd(lt, ltm), scm = mean(sc), scsd = sd(sc, scm)
  const X = rows.map((r) => [1, (r.logtvl - ltm) / ltsd, (r.score - scm) / scsd])
  const beta = irls(X, y)
  const sig = (z: number) => 1 / (1 + Math.exp(-z))
  const aucComb = auc(X.map((x) => sig(beta[0] + beta[1] * x[1] + beta[2] * x[2])), y)

  console.log('\nAUC (discrimination for 30d collapse):')
  console.log(`  log(TVL) alone:         ${aucTvl.toFixed(3)}`)
  console.log(`  Litmus score alone:     ${aucScore.toFixed(3)}`)
  console.log(`  TVL + score (logistic): ${aucComb.toFixed(3)}`)
  console.log(`  std coeffs -> logTVL ${beta[1].toFixed(3)}, score ${beta[2].toFixed(3)} (score ~0 = no independent signal)`)

  const s10 = stratified(rows, 10)
  console.log('\nWithin TVL deciles (size held): collapse% low-score vs high-score, + mean TVL each half')
  for (const t of s10.table)
    console.log(`  D${String(t.bin).padStart(2)} n=${String(t.n).padStart(5)}  low ${t.badLow.toFixed(1).padStart(5)}%  high ${t.badHigh.toFixed(1).padStart(5)}%   $${(t.tvlLow / 1e6).toFixed(1)}M vs $${(t.tvlHigh / 1e6).toFixed(1)}M`)

  console.log('\nConfound sweep (size-weighted badHigh-badLow; should stay flat if real, shrink if size artifact):')
  for (const nb of [10, 20, 40, 80]) console.log(`  ${String(nb).padStart(3)} bins -> ${stratified(rows, nb).avgPerverse.toFixed(2)} pts`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
