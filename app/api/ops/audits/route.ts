import { NextResponse } from 'next/server'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { isAssessmentAdmin } from '../../../../lib/auth'

export async function GET() {
  if (!(await isAssessmentAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const dir = join(process.cwd(), 'data', 'grades')
  const files = (await readdir(dir)).filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort()
  const snapshots = await Promise.all(files.map(async (file) => JSON.parse(await readFile(join(dir, file), 'utf8')) as { date?: string; count?: number; pools?: Array<{ poolId?: string; score?: number; grade?: string }> }))
  const latest = snapshots.at(-1)
  const latestPools = latest?.pools ?? []
  const ids = latestPools.map((pool) => pool.poolId).filter(Boolean)
  const duplicateIds = ids.length - new Set(ids).size
  const scoreGradeMismatches = latestPools.filter((pool) => { if (typeof pool.score !== 'number' || !pool.grade) return false; const expected = pool.score >= 85 ? 'A' : pool.score >= 72 ? 'B' : pool.score >= 60 ? 'C' : pool.score >= 45 ? 'D' : 'F'; return expected !== pool.grade }).length
  return NextResponse.json({ snapshotCount: snapshots.length, latestDate: latest?.date ?? files.at(-1)?.replace('.json', '') ?? null, declaredPools: latest?.count ?? 0, actualPools: latestPools.length, duplicateIds, scoreGradeMismatches, status: duplicateIds === 0 && scoreGradeMismatches === 0 && latestPools.length > 0 ? 'healthy' : 'needs_review' })
}
