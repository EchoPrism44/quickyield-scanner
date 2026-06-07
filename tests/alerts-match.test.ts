import { describe, it, expect } from 'vitest'
import { alertMatchesOpportunity, alertTargetLabel, rewardDependencyPct } from '../lib/alerts'
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

  describe('apy-drop (sudden yield collapse)', () => {
    it('fires when 24h APY change falls by at least the threshold points', () => {
      expect(alertMatchesOpportunity(alert({ condition: 'apy-drop', minApy: 5 }), pool({ apyPct1D: -6 }))).toBe(true)
      expect(alertMatchesOpportunity(alert({ condition: 'apy-drop', minApy: 5 }), pool({ apyPct1D: -3 }))).toBe(false)
    })
    it('does not fire when 24h change is missing', () => {
      expect(alertMatchesOpportunity(alert({ condition: 'apy-drop', minApy: 5 }), pool({ apyPct1D: undefined }))).toBe(false)
    })
    it('still fires for a low-confidence pool — degradation must not be masked', () => {
      expect(alertMatchesOpportunity(alert({ condition: 'apy-drop', minApy: 5, minConfidence: 95 }), pool({ apyPct1D: -9, confidence: 40 }))).toBe(true)
    })
  })

  describe('tvl-drop (liquidity exit)', () => {
    it('fires when TVL fell by at least the threshold percent since the previous scan', () => {
      expect(alertMatchesOpportunity(alert({ condition: 'tvl-drop', minApy: 20 }), pool({ tvlUsd: 750 }), { previousTvlUsd: 1000 })).toBe(true)
      expect(alertMatchesOpportunity(alert({ condition: 'tvl-drop', minApy: 20 }), pool({ tvlUsd: 900 }), { previousTvlUsd: 1000 })).toBe(false)
    })
    it('does not fire without a previous TVL to compare against', () => {
      expect(alertMatchesOpportunity(alert({ condition: 'tvl-drop', minApy: 20 }), pool({ tvlUsd: 100 }))).toBe(false)
    })
  })

  describe('reward-spike (incentive dependence)', () => {
    it('fires when reward tokens make up at least the threshold share of APY', () => {
      expect(alertMatchesOpportunity(alert({ condition: 'reward-spike', minApy: 60 }), pool({ apy: 10, apyReward: 7 }))).toBe(true)
      expect(alertMatchesOpportunity(alert({ condition: 'reward-spike', minApy: 60 }), pool({ apy: 10, apyReward: 3 }))).toBe(false)
    })
  })
})

describe('rewardDependencyPct', () => {
  it('computes reward share of APY, clamped to 0–100', () => {
    expect(rewardDependencyPct(pool({ apy: 10, apyReward: 4 }))).toBe(40)
    expect(rewardDependencyPct(pool({ apy: 0, apyReward: 4 }))).toBe(0)
    expect(rewardDependencyPct(pool({ apy: 10, apyReward: undefined }))).toBe(0)
  })
})

describe('alertTargetLabel', () => {
  it('produces a readable metric per condition', () => {
    expect(alertTargetLabel({ condition: 'apy-above', minApy: 5 })).toBe('APY ≥ 5%')
    expect(alertTargetLabel({ condition: 'apy-below', minApy: 5 })).toBe('APY ≤ 5%')
    expect(alertTargetLabel({ condition: 'apy-drop', minApy: 5 })).toBe('APY −5pts/24h')
    expect(alertTargetLabel({ condition: 'tvl-drop', minApy: 20 })).toBe('TVL −20%')
    expect(alertTargetLabel({ condition: 'reward-spike', minApy: 60 })).toBe('Reward ≥ 60%')
  })
})
