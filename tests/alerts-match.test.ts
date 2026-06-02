import { describe, it, expect } from 'vitest'
import { alertMatchesOpportunity } from '../lib/alerts'
import type { AlertRule, Opportunity } from '../lib/types'

const alert = (over: Partial<AlertRule>): AlertRule => ({
  id: 'a', userId: 'u', name: 'n', chain: 'All chains', category: 'All categories',
  asset: '', minApy: 5, maxRisk: 'Medium', minConfidence: 0, frequency: 'daily',
  condition: 'apy-above', enabled: true, createdAt: '', ...over,
})

const pool = (over: Partial<Opportunity>): Opportunity => ({
  apy: 10, risk: 'Low', chain: 'Ethereum', category: 'Staking', asset: 'ETH', confidence: 90, ...over,
} as Opportunity)

describe('alertMatchesOpportunity', () => {
  it('apy-above matches when apy is at or above the threshold', () => {
    expect(alertMatchesOpportunity(alert({ condition: 'apy-above', minApy: 8 }), pool({ apy: 10 }))).toBe(true)
    expect(alertMatchesOpportunity(alert({ condition: 'apy-above', minApy: 12 }), pool({ apy: 10 }))).toBe(false)
  })

  it('apy-below matches when apy is at or below the threshold (downside watch)', () => {
    expect(alertMatchesOpportunity(alert({ condition: 'apy-below', minApy: 6 }), pool({ apy: 5 }))).toBe(true)
    expect(alertMatchesOpportunity(alert({ condition: 'apy-below', minApy: 6 }), pool({ apy: 8 }))).toBe(false)
  })

  it('respects the asset filter (case-insensitive substring)', () => {
    expect(alertMatchesOpportunity(alert({ asset: 'USDC' }), pool({ asset: 'ETH' }))).toBe(false)
    expect(alertMatchesOpportunity(alert({ asset: 'eth' }), pool({ asset: 'ETH', apy: 10 }))).toBe(true)
  })

  it('respects risk, confidence, and chain gates', () => {
    expect(alertMatchesOpportunity(alert({ maxRisk: 'Low' }), pool({ risk: 'Medium' }))).toBe(false)
    expect(alertMatchesOpportunity(alert({ minConfidence: 95 }), pool({ confidence: 90 }))).toBe(false)
    expect(alertMatchesOpportunity(alert({ chain: 'Base' }), pool({ chain: 'Ethereum' }))).toBe(false)
  })
})
