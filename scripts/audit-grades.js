// scripts/audit-grades.js
// Corrected audit script — Phase A (snapshot integrity) + temporal analysis only.
// This script intentionally does NOT attempt model reproduction from live Llama data.

const fs = require('fs')
const path = require('path')

const BANDS = [
  { letter: 'A', min: 85 },
  { letter: 'B', min: 72 },
  { letter: 'C', min: 60 },
  { letter: 'D', min: 45 },
  { letter: 'F', min: 0 },
]

function bandFor(score) {
  for (let i = 0; i < BANDS.length; i++) {
    if (score >= BANDS[i].min) return BANDS[i]
  }
  return BANDS[BANDS.length - 1]
}

function safeNumber(v) {
  if (v === undefined || v === null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function readSnapshots(dir) {
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  return files.map((f) => {
    const p = path.join(dir, f)
    try {
      const raw = fs.readFileSync(p, 'utf8')
      const data = JSON.parse(raw)
      return { filename: f, path: p, data }
    } catch (err) {
      console.error('Failed to read/parse', p, err.message)
      return { filename: f, path: p, data: null, error: err.message }
    }
  })
}

function validateSnapshot(snapshot) {
  const out = {
    filename: snapshot.filename,
    date: snapshot.data && snapshot.data.date ? snapshot.data.date : null,
    declaredCount: snapshot.data && Number.isInteger(snapshot.data.count) ? snapshot.data.count : null,
    actualCount: Array.isArray(snapshot.data && snapshot.data.pools) ? snapshot.data.pools.length : 0,
    pools: [],
    summary: {},
  }

  const pools = snapshot.data && Array.isArray(snapshot.data.pools) ? snapshot.data.pools : []
  const seenPoolIds = new Set()
  const econMap = {}
  const gradeCounts = {}
  const anomalies = []

  for (const p of pools) {
    const poolId = p.poolId || p.pool || p.id || null
    const project = p.project || null
    const chain = p.chain || null
    const symbol = p.symbol || null
    const apy = safeNumber(p.apy)
    const tvlUsd = safeNumber(p.tvlUsd)
    const recordedScore = p.score === undefined ? undefined : safeNumber(p.score)
    const recordedGrade = p.grade || null

    const flags = []

    if (!poolId) flags.push('missing-poolId')
    if (!project) flags.push('missing-project')
    if (!chain) flags.push('missing-chain')
    if (!symbol) flags.push('missing-symbol')
    if (recordedGrade === null) flags.push('missing-grade')
    if (recordedScore === undefined) flags.push('missing-score')
    if (apy === undefined) flags.push('missing-apy')
    if (tvlUsd === undefined) flags.push('missing-tvlUsd')

    if (recordedScore !== undefined && (recordedScore < 0 || recordedScore > 100)) flags.push('score-out-of-range')
    if (apy !== undefined && (apy < -1000 || apy > 1e6)) flags.push('apy-suspicious')
    if (tvlUsd !== undefined && (tvlUsd < 0)) flags.push('tvl-negative')

    if (recordedScore !== undefined) {
      const expected = bandFor(recordedScore).letter
      if (recordedGrade && recordedGrade !== expected) flags.push('grade-score-mismatch')
      gradeCounts[expected] = (gradeCounts[expected] || 0) + 1
    } else if (recordedGrade) {
      gradeCounts[recordedGrade] = (gradeCounts[recordedGrade] || 0) + 1
    }

    const econKey = `${project || ''}|${symbol || ''}|${chain || ''}`
    econMap[econKey] = econMap[econKey] || []
    econMap[econKey].push(poolId || 'MISSING')

    if (tvlUsd !== undefined && tvlUsd >= 100_000_000 && (recordedScore === undefined || recordedScore < 50)) flags.push('high-tvl-low-score')
    if (apy !== undefined && (apy > 1000)) flags.push('very-high-apy')

    if (flags.length) anomalies.push({ poolId, project, chain, symbol, apy, tvlUsd, recordedScore, recordedGrade, flags })

    out.pools.push({ poolId, project, chain, symbol, apy, tvlUsd, recordedScore, recordedGrade, flags })
    if (poolId) seenPoolIds.add(poolId)
  }

  const duplicates = Object.entries(econMap).filter(([, ids]) => ids.length > 1).map(([k, ids]) => ({ econKey: k, poolIds: ids }))

  out.summary = {
    declaredCount: out.declaredCount,
    actualCount: out.actualCount,
    uniquePoolIds: seenPoolIds.size,
    gradeCounts,
    anomalies: anomalies.length,
    duplicates: duplicates.length,
    missingPools: out.declaredCount !== null ? (out.declaredCount - out.actualCount) : null,
  }
  out.anomalies = anomalies
  out.duplicates = duplicates

  return out
}

function temporalAnalysis(validatedSnapshots) {
  const poolMap = {}
  for (const vs of validatedSnapshots) {
    const date = vs.date || vs.filename
    for (const p of vs.pools) {
      const id = p.poolId || null
      if (!id) continue
      poolMap[id] = poolMap[id] || []
      poolMap[id].push({ date, record: p })
    }
  }

  const movers = []
  for (const [id, entries] of Object.entries(poolMap)) {
    if (entries.length < 2) continue
    entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    const first = entries[0].record
    const last = entries[entries.length - 1].record
    const apyFirst = safeNumber(first.apy)
    const apyLast = safeNumber(last.apy)
    const tvlFirst = safeNumber(first.tvlUsd)
    const tvlLast = safeNumber(last.tvlUsd)
    const scoreFirst = safeNumber(first.recordedScore)
    const scoreLast = safeNumber(last.recordedScore)

    const apyDelta = (apyFirst === undefined || apyLast === undefined) ? null : (apyLast - apyFirst)
    const apyPct = (apyFirst === undefined || apyFirst === 0 || apyDelta === null) ? null : (apyDelta / Math.abs(apyFirst))
    const tvlDelta = (tvlFirst === undefined || tvlLast === undefined) ? null : (tvlLast - tvlFirst)
    const tvlPct = (tvlFirst === undefined || tvlFirst === 0 || tvlDelta === null) ? null : (tvlDelta / Math.abs(tvlFirst))
    const scoreDelta = (scoreFirst === undefined || scoreLast === undefined) ? null : (scoreLast - scoreFirst)

    const flags = []
    if (apyDelta !== null && Math.abs(apyDelta) >= 10) flags.push('apy-abs-change>=10')
    if (apyPct !== null && Math.abs(apyPct) >= 0.5) flags.push('apy-rel-change>=50%')
    if (tvlPct !== null && Math.abs(tvlPct) >= 0.5) flags.push('tvl-rel-change>=50%')
    if (tvlDelta !== null && Math.abs(tvlDelta) >= 100_000_000) flags.push('tvl-abs-change>=100M')
    if (scoreDelta !== null && Math.abs(scoreDelta) >= 15) flags.push('score-change>=15')

    if (flags.length) {
      movers.push({ poolId: id, project: first.project, chain: first.chain, symbol: first.symbol, firstDate: entries[0].date, lastDate: entries[entries.length-1].date, apyFirst, apyLast, apyDelta, apyPct, tvlFirst, tvlLast, tvlDelta, tvlPct, scoreFirst, scoreLast, scoreDelta, flags })
    }
  }

  const summary = { snapshotsCount: validatedSnapshots.length, poolsWithHistory: Object.values(poolMap).filter((arr) => arr.length >= 2).length, moverCount: movers.length }
  return { summary, movers }
}

function writeReports(outDir, prefix, snapshotReport, temporal) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const jsonPath = path.join(outDir, `${prefix}.integrity.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(snapshotReport, null, 2) + '\n')

  const csvPath = path.join(outDir, `${prefix}.integrity.csv`)
  const headers = ['poolId','project','chain','symbol','apy','tvlUsd','recordedScore','recordedGrade','flags']
  const rows = [headers.join(',')]
  for (const p of snapshotReport.pools) {
    const row = [p.poolId || '', p.project || '', p.chain || '', p.symbol || '', p.apy === undefined ? '' : p.apy, p.tvlUsd === undefined ? '' : p.tvlUsd, p.recordedScore === undefined ? '' : p.recordedScore, p.recordedGrade || '', '"'+(p.flags||[]).join('; ')+'"']
    rows.push(row.join(','))
  }
  fs.writeFileSync(csvPath, rows.join('\n') + '\n')

  if (temporal) {
    const tjson = path.join(outDir, `${prefix}.temporal.json`)
    fs.writeFileSync(tjson, JSON.stringify(temporal, null, 2) + '\n')
    const tcsvPath = path.join(outDir, `${prefix}.temporal.csv`)
    const theaders = ['poolId','project','chain','symbol','firstDate','lastDate','apyFirst','apyLast','apyDelta','apyPct','tvlFirst','tvlLast','tvlDelta','tvlPct','scoreFirst','scoreLast','scoreDelta','flags']
    const trows = [theaders.join(',')]
    for (const m of temporal.movers) {
      const r = [m.poolId,m.project,m.chain,m.symbol,m.firstDate,m.lastDate,m.apyFirst===undefined?'':m.apyFirst,m.apyLast===undefined?'':m.apyLast,m.apyDelta===null?'':m.apyDelta,m.apyPct===null?'':m.apyPct,m.tvlFirst===undefined?'':m.tvlFirst,m.tvlLast===undefined?'':m.tvlLast,m.tvlDelta===null?'':m.tvlDelta,m.tvlPct===null?'':m.tvlPct,m.scoreFirst===undefined?'':m.scoreFirst,m.scoreLast===undefined?'':m.scoreLast,m.scoreDelta===null?'':m.scoreDelta,'"'+(m.flags||[]).join('; ')+'"']
      trows.push(r.join(','))
    }
    fs.writeFileSync(tcsvPath, trows.join('\n') + '\n')
  }
}

async function main() {
  const gradesDir = path.join(process.cwd(), 'data', 'grades')
  const snapshots = readSnapshots(gradesDir)
  if (snapshots.length === 0) {
    console.error('No snapshots found in data/grades')
    process.exit(1)
  }

  const validated = []
  for (const snap of snapshots) {
    if (!snap.data) {
      console.warn('Skipping unreadable snapshot', snap.filename)
      continue
    }
    const v = validateSnapshot(snap)
    validated.push(v)
  }

  const temporal = temporalAnalysis(validated)

  const outDir = path.join(process.cwd(), 'audit-reports')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
  const bundlePath = path.join(outDir, `grades-integrity-${stamp}.json`)
  const bundle = { runAt: new Date().toISOString(), snapshots: validated.map((v)=>({ filename: v.filename, date: v.date, summary: v.summary })), temporal: temporal.summary }
  fs.writeFileSync(bundlePath, JSON.stringify(bundle, null, 2) + '\n')

  for (const v of validated) {
    const prefix = v.filename.replace(/\.json$/, '')
    writeReports(outDir, prefix, v, temporal)
  }

  const temporalPath = path.join(outDir, `temporal-summary-${stamp}.json`)
  fs.writeFileSync(temporalPath, JSON.stringify(temporal, null, 2) + '\n')

  console.log('Integrity and temporal audit complete.')
  console.log('Reports written to', outDir)
  console.log('Temporal summary:', temporal.summary)
}

main().catch((err)=>{ console.error(err); process.exit(2) })
