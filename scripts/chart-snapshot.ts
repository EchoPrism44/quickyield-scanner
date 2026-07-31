/**
 * Blog chart generator — turns a weekly grade snapshot into theme-matched SVG
 * charts you can embed straight into a post.
 *
 * Usage:
 *   npm run blog:charts                 # latest snapshot
 *   npx tsx scripts/chart-snapshot.ts 2026-07-20
 *
 * Writes to public/blog/charts/<date>-*.svg, so a post embeds them as:
 *   ![APY distribution](/blog/charts/2026-07-27-apy-distribution.svg)
 *
 * SVG (not PNG) on purpose: no Python/matplotlib toolchain, scales cleanly at
 * any width, and the colors are the site's own tokens so charts look native on
 * the dark theme. Values are hardcoded here because an <img>-embedded SVG is a
 * separate document and cannot read the page's CSS variables.
 */
import fs from 'node:fs'
import path from 'node:path'
import { GRADES, listSnapshotDates, loadSnapshot, type Snapshot } from '../lib/snapshot-delta'

const C = {
  bg: '#10151c',
  line: 'rgba(255,255,255,0.07)',
  ink: '#f5f6f8',
  inkDim: '#a6adba',
  inkMute: '#6b7280',
  signal: '#2f88ff',
  grade: { A: '#00E676', B: '#7adfa0', C: '#ffb020', D: '#ff8a4d', F: '#ff3366' } as Record<string, string>,
}

const W = 860
const H = 440
const M = { top: 56, right: 28, bottom: 64, left: 72 }
const PW = W - M.left - M.right
const PH = H - M.top - M.bottom

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const n2 = (v: number) => (Math.round(v * 100) / 100).toString()

function frame(title: string, subtitle: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
  <rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>
  <text x="${M.left}" y="30" fill="${C.ink}" font-size="17" font-weight="600">${esc(title)}</text>
  <text x="${M.left}" y="48" fill="${C.inkMute}" font-size="12">${esc(subtitle)}</text>
  ${body}
</svg>
`
}

/** Horizontal gridlines + y tick labels, drawn in plot space. */
function yAxis(maxVal: number, fmt: (v: number) => string, ticks = 4) {
  let out = ''
  for (let i = 0; i <= ticks; i++) {
    const v = (maxVal / ticks) * i
    const y = M.top + PH - (PH / ticks) * i
    out += `<line x1="${M.left}" y1="${y}" x2="${M.left + PW}" y2="${y}" stroke="${C.line}" stroke-width="1"/>`
    out += `<text x="${M.left - 10}" y="${y + 4}" fill="${C.inkMute}" font-size="11" text-anchor="end">${esc(fmt(v))}</text>`
  }
  return out
}

function bars(
  values: number[],
  labels: string[],
  colors: string[],
  opts: { title: string; subtitle: string; xLabel: string; yFmt?: (v: number) => string; labelEvery?: number },
) {
  const max = Math.max(...values, 1)
  const yFmt = opts.yFmt ?? ((v: number) => Math.round(v).toLocaleString())
  const bw = PW / values.length
  const gap = values.length > 40 ? 0.5 : values.length > 12 ? 1.5 : 10
  const labelEvery = opts.labelEvery ?? 1

  let body = yAxis(max, yFmt)
  values.forEach((v, i) => {
    const h = max > 0 ? (v / max) * PH : 0
    const x = M.left + i * bw + gap / 2
    const y = M.top + PH - h
    body += `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(Math.max(bw - gap, 0.5))}" height="${n2(h)}" fill="${colors[i]}" rx="${bw > 12 ? 3 : 1}"><title>${esc(labels[i])}: ${esc(yFmt(v))}</title></rect>`
    if (i % labelEvery === 0) {
      body += `<text x="${n2(x + (bw - gap) / 2)}" y="${M.top + PH + 18}" fill="${C.inkMute}" font-size="11" text-anchor="middle">${esc(labels[i])}</text>`
    }
  })
  body += `<line x1="${M.left}" y1="${M.top + PH}" x2="${M.left + PW}" y2="${M.top + PH}" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>`
  body += `<text x="${M.left + PW / 2}" y="${H - 16}" fill="${C.inkDim}" font-size="12" text-anchor="middle">${esc(opts.xLabel)}</text>`
  return frame(opts.title, opts.subtitle, body)
}

function histogram(values: number[], binCount: number, min: number, max: number) {
  const counts = new Array(binCount).fill(0)
  const w = (max - min) / binCount
  for (const v of values) {
    if (v < min || v > max) continue
    const i = Math.min(binCount - 1, Math.floor((v - min) / w))
    counts[i] += 1
  }
  return { counts, w }
}

function quantile(sorted: number[], q: number) {
  if (sorted.length === 0) return 0
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base]
}

// ---------- charts ----------

function apyDistribution(snap: Snapshot) {
  const all = snap.pools.map((p) => p.apy).filter((v) => Number.isFinite(v) && v >= 0)
  const MAXV = 50
  const binCount = 50
  const { counts, w } = histogram(all, binCount, 0, MAXV)
  const above = all.filter((v) => v > MAXV).length
  const labels = counts.map((_, i) => `${Math.round(i * w)}–${Math.round((i + 1) * w)}%`)
  return bars(counts, labels, counts.map(() => C.signal), {
    title: `APY distribution — ${snap.date}`,
    subtitle: `${all.length.toLocaleString()} graded pools · 0–${MAXV}% shown · ${above.toLocaleString()} pools above ${MAXV}% not pictured`,
    xLabel: 'APY (%)',
    labelEvery: 10,
  })
}

function tvlDistribution(snap: Snapshot) {
  const pos = snap.pools.map((p) => p.tvlUsd).filter((v) => Number.isFinite(v) && v > 0)
  const logs = pos.map((v) => Math.log10(v))
  const min = 3 // $1K
  const max = 11 // $100B
  const binCount = 32
  const { counts, w } = histogram(logs, binCount, min, max)
  const labels = counts.map((_, i) => {
    const e = min + i * w
    return e >= 9 ? `$${10 ** (e - 9) < 10 ? Math.round(10 ** (e - 9)) : '10+'}B` : e >= 6 ? `$${Math.round(10 ** (e - 6))}M` : `$${Math.round(10 ** (e - 3))}K`
  })
  return bars(counts, labels, counts.map(() => C.grade.B), {
    title: `TVL distribution — ${snap.date}`,
    subtitle: `${pos.length.toLocaleString()} pools with TVL > $0 · log scale (TVL is heavily skewed)`,
    xLabel: 'Pool TVL (log scale)',
    labelEvery: 4,
  })
}

function gradeCounts(snap: Snapshot) {
  const counts = GRADES.map((g) => snap.pools.filter((p) => p.grade === g).length)
  const total = counts.reduce((a, b) => a + b, 0) || 1
  const labels = GRADES.map((g, i) => `${g} (${Math.round((counts[i] / total) * 100)}%)`)
  return bars(counts, labels as string[], GRADES.map((g) => C.grade[g]), {
    title: `Pools by Safety Grade — ${snap.date}`,
    subtitle: `${total.toLocaleString()} pools graded this week`,
    xLabel: 'Safety Grade',
  })
}

/** Median + interquartile range of APY within each grade — does the grade separate anything? */
function apyByGrade(snap: Snapshot) {
  const stats = GRADES.map((g) => {
    const vals = snap.pools.filter((p) => p.grade === g).map((p) => p.apy).filter((v) => Number.isFinite(v) && v >= 0).sort((a, b) => a - b)
    return { g, n: vals.length, p25: quantile(vals, 0.25), med: quantile(vals, 0.5), p75: quantile(vals, 0.75), p90: quantile(vals, 0.9) }
  })
  const max = Math.max(...stats.map((s) => s.p90), 1)
  const bw = PW / stats.length

  let body = yAxis(max, (v) => `${v.toFixed(1)}%`)
  stats.forEach((s, i) => {
    const cx = M.left + i * bw + bw / 2
    const y = (v: number) => M.top + PH - (v / max) * PH
    const boxW = Math.min(bw * 0.42, 74)
    const col = C.grade[s.g]
    // p25–p75 box
    body += `<rect x="${n2(cx - boxW / 2)}" y="${n2(y(s.p75))}" width="${n2(boxW)}" height="${n2(Math.max(y(s.p25) - y(s.p75), 1))}" fill="${col}" fill-opacity="0.25" stroke="${col}" stroke-width="1.5" rx="3"><title>${s.g}: p25 ${n2(s.p25)}% · median ${n2(s.med)}% · p75 ${n2(s.p75)}%</title></rect>`
    // whisker to p90
    body += `<line x1="${n2(cx)}" y1="${n2(y(s.p75))}" x2="${n2(cx)}" y2="${n2(y(s.p90))}" stroke="${col}" stroke-width="1.5" stroke-dasharray="3 3"/>`
    body += `<line x1="${n2(cx - boxW / 4)}" y1="${n2(y(s.p90))}" x2="${n2(cx + boxW / 4)}" y2="${n2(y(s.p90))}" stroke="${col}" stroke-width="1.5"/>`
    // median
    body += `<line x1="${n2(cx - boxW / 2)}" y1="${n2(y(s.med))}" x2="${n2(cx + boxW / 2)}" y2="${n2(y(s.med))}" stroke="${col}" stroke-width="3"/>`
    body += `<text x="${n2(cx)}" y="${n2(y(s.med) - 10)}" fill="${C.ink}" font-size="12" font-weight="600" text-anchor="middle">${n2(s.med)}%</text>`
    body += `<text x="${n2(cx)}" y="${M.top + PH + 18}" fill="${C.inkMute}" font-size="12" text-anchor="middle">${s.g}</text>`
    body += `<text x="${n2(cx)}" y="${M.top + PH + 34}" fill="${C.inkMute}" font-size="10" text-anchor="middle">n=${s.n.toLocaleString()}</text>`
  })
  body += `<line x1="${M.left}" y1="${M.top + PH}" x2="${M.left + PW}" y2="${M.top + PH}" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>`
  body += `<text x="${M.left + PW / 2}" y="${H - 12}" fill="${C.inkDim}" font-size="12" text-anchor="middle">Safety Grade — box = 25th–75th percentile, bar = median, dashed = 90th</text>`

  return frame(`APY by Safety Grade — ${snap.date}`, 'Where each grade’s yields actually sit. Higher grades should cluster lower and tighter.', body)
}

// ---------- main ----------
const arg = process.argv.slice(2).find((a) => !a.startsWith('--'))
const dates = listSnapshotDates()
const date = arg ?? dates[dates.length - 1]
if (!date) {
  console.error('No snapshots found in data/grades/')
  process.exit(1)
}

const snap = loadSnapshot(date)
const outDir = path.join(process.cwd(), 'public', 'blog', 'charts')
fs.mkdirSync(outDir, { recursive: true })

const charts: [string, string][] = [
  [`${date}-apy-distribution.svg`, apyDistribution(snap)],
  [`${date}-tvl-distribution.svg`, tvlDistribution(snap)],
  [`${date}-grade-counts.svg`, gradeCounts(snap)],
  [`${date}-apy-by-grade.svg`, apyByGrade(snap)],
]

for (const [name, svg] of charts) {
  fs.writeFileSync(path.join(outDir, name), svg)
  console.log(`wrote public/blog/charts/${name}`)
}

console.log(`\nEmbed in a post with:\n`)
for (const [name] of charts) {
  console.log(`![${name.replace(`${date}-`, '').replace('.svg', '').replace(/-/g, ' ')}](/blog/charts/${name})`)
}
