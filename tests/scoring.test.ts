import { describe, expect, it } from 'vitest'
import { curatedOpportunities } from '../lib/curated'
import { inferCategory, poolToOpportunity } from '../lib/scoring'
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

describe('yield scoring and normalization', () => {
  it('infers stablecoin and staking categories', () => {
    expect(inferCategory({ symbol: 'USDC', stablecoin: true })).toBe('Stablecoin lending')
    expect(inferCategory({ symbol: 'stETH', stablecoin: false })).toBe('Staking')
  })

  it('keeps confidence within product bounds', () => {
    const opportunity = poolToOpportunity(basePool, 0)
    expect(opportunity.confidence).toBeGreaterThanOrEqual(58)
    expect(opportunity.confidence).toBeLessThanOrEqual(96)
    expect(opportunity.risk).toBe('Low')
    expect(opportunity.source).toBe('Live')
  })

  it('keeps curated fallback opportunities available', () => {
    expect(curatedOpportunities.length).toBeGreaterThan(0)
    expect(curatedOpportunities.some((item) => item.source === 'Curated')).toBe(true)
  })
})
