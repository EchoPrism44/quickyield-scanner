import { describe, it, expect } from 'vitest'
import { blendedApy, projectedAnnualUsd, summarizePortfolio } from '../lib/portfolio'
import type { PositionView } from '../lib/types'

describe('portfolio math', () => {
  it('blendedApy is capital-weighted', () => {
    expect(blendedApy([{ amountUsd: 1000, apy: 4 }, { amountUsd: 3000, apy: 8 }])).toBeCloseTo(7)
    expect(blendedApy([])).toBe(0)
    expect(blendedApy([{ amountUsd: 0, apy: 5 }])).toBe(0)
  })

  it('projectedAnnualUsd sums amount * apy / 100', () => {
    expect(projectedAnnualUsd([{ amountUsd: 1000, apy: 5 }, { amountUsd: 2000, apy: 10 }])).toBeCloseTo(250)
  })

  it('summarizePortfolio uses current APY with entry fallback', () => {
    const positions: PositionView[] = [
      { id: '1', userId: 'u', opportunityId: 'o1', platform: 'A', asset: 'X', chain: 'E', amountUsd: 1000, entryApy: 5, createdAt: '', current: { apy: 10, tvl: '', safety: { letter: 'A', score: 90, label: 'Very safe', summary: '', weakest: 'liquidity' }, logoUrl: undefined } },
      { id: '2', userId: 'u', opportunityId: 'o2', platform: 'B', asset: 'Y', chain: 'E', amountUsd: 1000, entryApy: 6, createdAt: '', current: null },
    ]
    const s = summarizePortfolio(positions)
    expect(s.positionCount).toBe(2)
    expect(s.totalUsd).toBe(2000)
    expect(s.blendedApy).toBeCloseTo(8) // (1000*10 + 1000*6) / 2000
    expect(s.projectedAnnualUsd).toBeCloseTo(160)
  })
})
