import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { getLedgerSummary } from '../lib/ledger'

const cleanups: string[] = []

function fixtureDir(files: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-'))
  cleanups.push(dir)
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), JSON.stringify(content))
  }
  return dir
}

afterEach(() => {
  while (cleanups.length) rmSync(cleanups.pop()!, { recursive: true, force: true })
})

const snap = (date: string, grades: string[], chains: string[] = ['Ethereum']) => ({
  date,
  count: grades.length,
  pools: grades.map((grade, i) => ({ grade, chain: chains[i % chains.length] })),
})

describe('getLedgerSummary', () => {
  it('aggregates snapshots in date order with distributions and chain counts', () => {
    const dir = fixtureDir({
      '2026-06-15.json': snap('2026-06-15', ['A', 'B', 'B', 'F'], ['Ethereum', 'Base']),
      '2026-06-11.json': snap('2026-06-11', ['A', 'C']),
    })
    const summary = getLedgerSummary(dir)
    expect(summary).not.toBeNull()
    expect(summary!.snapshots.map((s) => s.date)).toEqual(['2026-06-11', '2026-06-15'])
    expect(summary!.latest.date).toBe('2026-06-15')
    expect(summary!.latest.dist).toEqual({ A: 1, B: 2, C: 0, D: 0, F: 1 })
    expect(summary!.latest.chains).toBe(2)
    expect(summary!.totals).toEqual({ snapshotCount: 2, firstDate: '2026-06-11', poolsGradedCumulative: 6 })
    expect(summary!.latest.githubUrl).toContain('2026-06-15.json')
  })

  it('ignores files that are not dated snapshots', () => {
    const dir = fixtureDir({
      '2026-06-11.json': snap('2026-06-11', ['A']),
      'README.json': { not: 'a snapshot' },
    })
    const summary = getLedgerSummary(dir)
    expect(summary!.totals.snapshotCount).toBe(1)
  })

  it('fails soft to null when the directory is missing or empty', () => {
    expect(getLedgerSummary(join(tmpdir(), 'does-not-exist-ledger'))).toBeNull()
    const empty = mkdtempSync(join(tmpdir(), 'ledger-empty-'))
    cleanups.push(empty)
    mkdirSync(empty, { recursive: true })
    expect(getLedgerSummary(empty)).toBeNull()
  })

  it('counts unknown grade letters as nothing but keeps the pool count', () => {
    const dir = fixtureDir({ '2026-06-11.json': snap('2026-06-11', ['A', 'X']) })
    const summary = getLedgerSummary(dir)
    expect(summary!.latest.count).toBe(2)
    expect(summary!.latest.dist.A).toBe(1)
  })
})
