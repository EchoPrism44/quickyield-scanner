import { describe, expect, it } from 'vitest'
import { poolToOpportunity, inferCategory, formatTvl } from '../lib/scoring'
import type { LlamaPool } from '../lib/types'

const basePool: LlamaPool = {
  pool: 'pool-1',
  chain: 'Base',
  project: 'aave-v3',
  symbol: 'USDC',
  tvlUsd: 120_000_000,
  apy: 6.2,
  apyBase: 6.2,
  apyMean30d: 5.9,
  apyPct1D: 0.2,
  stablecoin: true,
}

describe('scoring edge cases', () => {
  it('handles zero TVL', () => {
    const pool = { ...basePool, tvlUsd: 0 }
    const opp = poolToOpportunity(pool, 0)
    expect(opp.tvl).toBe('$0.00')
    expect(opp.tvlUsd).toBe(0)
    expect(opp.confidence).toBeGreaterThanOrEqual(58)
  })

  it('handles missing APY values', () => {
    const pool = { ...basePool, apy: undefined, apyBase: undefined }
    const opp = poolToOpportunity(pool, 0)
    expect(opp.apy).toBe(0)
  })

  it('handles extremely high APY', () => {
    const pool = { ...basePool, apy: 100 }
    const opp = poolToOpportunity(pool, 0)
    expect(opp.apy).toBe(100)
    expect(opp.risk).toBe('Medium')
    expect(opp.confidence).toBeLessThanOrEqual(96)
  })

  it('handles negative APY change', () => {
    const pool = { ...basePool, apyPct1D: -15 }
    const opp = poolToOpportunity(pool, 0)
    expect(opp.trend).toBe('down')
  })

  it('infers category for unknown symbols', () => {
    expect(inferCategory({ symbol: 'UNKNOWN', stablecoin: false })).toBe('Stablecoin lending')
  })

  it('formats TVL correctly', () => {
    expect(formatTvl(1_500_000_000)).toBe('$1.5B')
    expect(formatTvl(2_500_000)).toBe('$2.5M')
    expect(formatTvl(500_000)).toBe('$500K')
    expect(formatTvl(999)).toBe('$999')
  })

  it('handles high volatility penalty', () => {
    const pool = { ...basePool, apyPct1D: 25 }
    const opp = poolToOpportunity(pool, 0)
    expect(opp.risk).toBe('Medium')
    expect(opp.confidence).toBeLessThan(70)
  })
})
