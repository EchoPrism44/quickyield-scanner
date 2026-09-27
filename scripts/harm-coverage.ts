/**
 * Harm-coverage — the Phase 1 feasibility slice for the safety-signal rebuild.
 * ---------------------------------------------------------------------------
 * The lift-test showed the grade doesn't beat raw TVL at predicting TVL-collapse.
 * But TVL-collapse is a size proxy, not harm. The real question (handoff §7) is
 * whether the grade predicts REAL harm — exploits, rugs, oracle manipulation.
 *
 * Before anyone builds the contract-risk feature engine, this script answers the
 * prerequisite nobody has measured: do enough real harm events even intersect the
 * graded pool universe over the existing ~11-week ledger to validate anything?
 *
 * It (1) loads the grade ledger, (2) fetches DeFiLlama harm events + the protocol
 * bridge, (3) joins them — a snapshot observation is a POSITIVE if that protocol
 * suffers a harm event within H days after the snapshot date — and (4) reports
 * coverage at pool and protocol-snapshot level. Only IF a preregistered minimum
 * of positives is met does it report a grade-vs-TVL-vs-random AUC (with a
 * label-permutation null and a D/F-vs-A/B 2x2), so we never over-read noise.
 *
 * Reuses auc() from lift-test.ts and loadSnapshots()/flagGlitches() from
 * validate-snapshots.ts. Reads only; the append-only ledger is never modified.
 *
 * Run: npx tsx scripts/harm-coverage.ts   (or: npm run harm-coverage)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { auc } from './lift-test'
import { loadSnapshots, flagGlitches } from './validate-snapshots'
import {
  fetchHarmEvents,
  fetchProtocolIndex,
  eventHitsProject,
  type HarmEvent,
  type ProtocolIndex,
} from '../lib/harm-events'

const HORIZONS = [30, 90] // days after a snapshot to look for a harm event
const DAY = 86_400_000
// Preregistered minimum protocol-level positives below which an AUC is NOT
// reported as meaningful. Decided before seeing the result (see §3 of the plan).
const MIN_POSITIVES = 30
const PERMUTATIONS = 2000 // label-permutation null replicates

type Obs = {
  date: string
  t: number
  project: string
  poolId: string
  chain: string
  symbol: string
  grade: string
  score: number
  tvlUsd: number
}

/** Flatten the ledger to observations, dropping data glitches. */
function toObs(snaps: ReturnType<typeof loadSnapshots>, glitchKeys: Set<string>): Obs[] {
  const rows: Obs[] = []
  for (const s of snaps) {
    for (const p of s.pools) {
      if (glitchKeys.has(`${s.date}|${p.poolId}`)) continue
      if (!(p.tvlUsd > 0) || typeof p.score !== 'number') continue
      rows.push({
        date: s.date,
        t: s.t,
        project: p.project,
        poolId: p.poolId,
        chain: p.chain,
        symbol: p.symbol,
        grade: p.grade,
        score: p.score,
        tvlUsd: p.tvlUsd,
      })
    }
  }
  return rows
}

/**
 * Label an observation positive if its protocol has a harm event in (t, t+H].
 * Returns the matching event (for classification breakdown) or null.
 */
function harmWithin(obs: Obs, events: HarmEvent[], idx: ProtocolIndex, horizonDays: number): HarmEvent | null {
  const lo = obs.t
  const hi = obs.t + horizonDays * DAY
  for (const ev of events) {
    if (ev.t > lo && ev.t <= hi && eventHitsProject(ev, obs.project, idx)) return ev
  }
  return null
}

function pct(n: number, d: number): string {
  return d === 0 ? '—' : `${((n / d) * 100).toFixed(2)}%`
}

/** Mann-Whitney permutation p-value: P(null AUC >= observed) under shuffled labels. */
function permutationP(preds: number[], ys: number[], observed: number, k: number): number {
  const shuffled = [...ys]
  let ge = 0
  let sum = 0
  let sumSq = 0
  for (let i = 0; i < k; i++) {
    // Fisher–Yates using a deterministic LCG so the run is reproducible without deps.
    let seed = (i + 1) * 2654435761
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    for (let j = shuffled.length - 1; j > 0; j--) {
      const r = Math.floor(rand() * (j + 1))
      ;[shuffled[j], shuffled[r]] = [shuffled[r], shuffled[j]]
    }
    const a = auc(preds, shuffled)
    if (a >= observed) ge++
    sum += a
    sumSq += a * a
  }
  const mean = sum / k
  const sd = Math.sqrt(Math.max(0, sumSq / k - mean * mean))
  console.log(`  permutation null (${k}x): mean AUC ${mean.toFixed(3)}, sd ${sd.toFixed(3)}`)
  return (ge + 1) / (k + 1) // add-one smoothing
}

function main() {
  const snaps = loadSnapshots()
  const { keys: glitchKeys } = flagGlitches(snaps)
  const obs = toObs(snaps, glitchKeys)
  const distinctProjects = new Set(obs.map((o) => o.project))

  console.log('=== Litmus harm-coverage (Phase 1 feasibility slice) ===')
  console.log(
    `ledger: ${snaps.length} snapshots ${snaps[0]?.date} -> ${snaps[snaps.length - 1]?.date} | ` +
      `${obs.length} clean observations across ${distinctProjects.size} distinct protocols (glitches excluded: ${glitchKeys.size})`,
  )

  return { snaps, obs, distinctProjects }
}

async function run() {
  const { snaps, obs, distinctProjects } = main()

  const events = await fetchHarmEvents()
  const idx = await fetchProtocolIndex()
  console.log(`\nharm feed: ${events.length} DeFiLlama events | protocol directory: ${idx.knownSlugs.size} slugs`)
  if (events.length === 0 || idx.knownSlugs.size === 0) {
    console.log('!! harm feed or protocol directory empty (network?) — cannot assess coverage. Aborting.')
    return
  }

  // How many harm events even *could* touch a graded protocol, ignoring time?
  const gradedProjects = [...distinctProjects]
  const eventsHittingUniverse = events.filter((ev) => gradedProjects.some((p) => eventHitsProject(ev, p, idx)))
  const ledgerStart = snaps[0]?.t ?? 0
  const ledgerEnd = snaps[snaps.length - 1]?.t ?? 0
  const eventsInEra = eventsHittingUniverse.filter((ev) => ev.t >= ledgerStart - 90 * DAY && ev.t <= ledgerEnd + 90 * DAY)
  console.log(
    `harm events mapping to a graded protocol (any date): ${eventsHittingUniverse.length} | ` +
      `within the ledger era (±90d of ${snaps[0]?.date}..${snaps[snaps.length - 1]?.date}): ${eventsInEra.length}`,
  )
  if (eventsInEra.length > 0) {
    console.log('  era-relevant events:')
    for (const ev of eventsInEra.sort((a, b) => a.t - b.t)) {
      console.log(
        `    ${ev.date}  ${ev.protocolName}  [${ev.classification}]  ${ev.amountUsd ? `$${(ev.amountUsd / 1e6).toFixed(1)}M` : 'amt?'}`,
      )
    }
  }

  // The decisive coverage numbers, per horizon.
  for (const H of HORIZONS) {
    console.log(`\n--- horizon H = ${H} days ---`)
    const matched = obs.map((o) => ({ o, ev: harmWithin(o, events, idx, H) }))
    // Only observations that actually HAVE an H-day forward window in the ledger
    // can be scored; a snapshot in the last H days has no complete lookforward,
    // but a harm event can still land, so we keep all and report both views.
    const posPool = matched.filter((m) => m.ev)
    const poolPositives = posPool.length

    // Protocol-snapshot level: one (date, project) counts once (events fan out to
    // all a protocol's pools, so pool-level positives are not independent).
    const protoSnapKeys = new Set<string>()
    const protoSnapPos = new Set<string>()
    const classByKey = new Map<string, string>() // one classification per protocol-snapshot
    for (const m of matched) {
      const key = `${m.o.date}|${m.o.project}`
      protoSnapKeys.add(key)
      if (m.ev) {
        protoSnapPos.add(key)
        if (!classByKey.has(key)) classByKey.set(key, m.ev.classification)
      }
    }
    const byClass = new Map<string, number>()
    for (const c of classByKey.values()) byClass.set(c, (byClass.get(c) ?? 0) + 1)

    console.log(
      `pool-observations: ${poolPositives}/${obs.length} positive (${pct(poolPositives, obs.length)})`,
    )
    console.log(
      `protocol-snapshots: ${protoSnapPos.size}/${protoSnapKeys.size} positive (${pct(protoSnapPos.size, protoSnapKeys.size)})  <-- honest denominator`,
    )
    if (byClass.size > 0) {
      console.log('  positive protocol-snapshots by classification:')
      for (const [c, n] of [...byClass.entries()].sort((a, b) => b[1] - a[1])) console.log(`    ${c}: ${n}`)
    }

    // --- Conditional harm-signal test, gated on the preregistered minimum ---
    if (protoSnapPos.size < MIN_POSITIVES) {
      console.log(
        `\nVERDICT (H=${H}): ${protoSnapPos.size} protocol-level positives < preregistered minimum ${MIN_POSITIVES}.`,
      )
      console.log(
        '  Insufficient harm density in the current ledger to validate a safety signal. This is itself the',
      )
      console.log(
        '  evidence for the interim framing: call the grade "market-quality / yield-hygiene," NOT "safety."',
      )
      continue
    }

    // Enough signal: report grade vs log(TVL) vs random on the harm label.
    // Dedup to protocol-snapshot level so observations are independent; take the
    // worst (min) grade score for a protocol on each date as its representative.
    const repByKey = new Map<string, { score: number; tvl: number; bad: number; grade: string }>()
    for (const m of matched) {
      const key = `${m.o.date}|${m.o.project}`
      const cur = repByKey.get(key)
      const bad = m.ev ? 1 : 0
      if (!cur || m.o.score < cur.score) {
        repByKey.set(key, { score: m.o.score, tvl: m.o.tvlUsd, bad, grade: m.o.grade })
      } else if (bad === 1 && cur.bad === 0) {
        cur.bad = 1
      }
    }
    const reps = [...repByKey.values()]
    const y = reps.map((r) => r.bad)
    const scorePred = reps.map((r) => -r.score) // lower score => more harm-prone (higher risk)
    const tvlPred = reps.map((r) => -Math.log10(Math.max(r.tvl, 1))) // smaller => riskier
    const aucScore = auc(scorePred, y)
    const aucTvl = auc(tvlPred, y)

    console.log(`\nHARM-SIGNAL TEST (H=${H}, protocol-snapshot level, N=${reps.length}, positives=${y.reduce((a, b) => a + b, 0)}):`)
    console.log(`  AUC — grade score (low=risky): ${aucScore.toFixed(3)}`)
    console.log(`  AUC — log(TVL) (small=risky):  ${aucTvl.toFixed(3)}`)
    console.log(`  baseline (random):             0.500`)
    const p = permutationP(scorePred, y, aucScore, PERMUTATIONS)
    console.log(`  grade-score AUC permutation p-value: ${p.toFixed(4)}`)

    // Interpretable 2x2: does D/F flag harm better than A/B?
    const lowGrade = (g: string) => g === 'D' || g === 'F'
    let dfBad = 0
    let dfTot = 0
    let abBad = 0
    let abTot = 0
    for (const r of reps) {
      if (lowGrade(r.grade)) {
        dfTot++
        if (r.bad) dfBad++
      } else {
        abTot++
        if (r.bad) abBad++
      }
    }
    console.log('  2x2 harm rate by grade band:')
    console.log(`    D/F: ${dfBad}/${dfTot} (${pct(dfBad, dfTot)})   A/B/C: ${abBad}/${abTot} (${pct(abBad, abTot)})`)
    console.log(`\nVERDICT (H=${H}): sufficient positives; see AUC + p-value above. Grade beats TVL? ${aucScore > aucTvl ? 'YES' : 'NO'}.`)
  }

  // Reproducibility snapshot of the fetched hacks — a NEW path, never data/grades/.
  try {
    const dir = join(process.cwd(), 'data', 'harm')
    mkdirSync(dir, { recursive: true })
    const stamp = snaps[snaps.length - 1]?.date ?? 'latest'
    const outPath = join(dir, `hacks-${stamp}.json`)
    writeFileSync(outPath, JSON.stringify({ fetchedFor: stamp, count: events.length, events }, null, 2))
    console.log(`\ncached ${events.length} harm events -> data/harm/hacks-${stamp}.json (reproducibility; not part of the ledger)`)
  } catch (e) {
    console.log(`\n(could not cache harm events: ${(e as Error).message})`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
