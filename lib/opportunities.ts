import { categories, chains, riskLevels, timeCosts } from './constants'
import { curatedOpportunities } from './curated'
import { cacheOpportunities, getCachedOpportunities } from './store'
import { poolToOpportunity } from './scoring'
import type { LlamaPool, Opportunity, OpportunityFilters } from './types'

const LIVE_FEED_TIMEOUT_MS = 15000

function valid(value: string | undefined, options: string[], fallback: string) {
  return value && options.includes(value) ? value : fallback
}

function applyFilters(opportunities: Opportunity[], filters: OpportunityFilters) {
  const q = filters.q?.trim().toLowerCase() ?? ''
  const chain = valid(filters.chain, chains, 'All chains')
  const risk = valid(filters.risk, riskLevels, 'All risk')
  const time = valid(filters.time, timeCosts, 'Any time')
  const category = valid(filters.category, categories, 'All categories')
  const capital = Number.isFinite(filters.capital) ? Number(filters.capital) : 100

  return opportunities
    .filter((item) => !q || [item.name, item.platform, item.category, item.chain, item.asset, item.symbol, item.notes].join(' ').toLowerCase().includes(q))
    .filter((item) => chain === 'All chains' || item.chain === chain)
    .filter((item) => risk === 'All risk' || item.risk === risk)
    .filter((item) => time === 'Any time' || item.time === time)
    .filter((item) => category === 'All categories' || item.category === category)
    .filter((item) => item.minimum <= capital)
    .sort((a, b) => b.confidence - a.confidence)
}

async function fetchLiveOpportunities() {
  const response = await fetch('https://yields.llama.fi/pools', {
    cache: 'no-store',
    signal: AbortSignal.timeout(LIVE_FEED_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`DeFiLlama returned ${response.status}`)
  const payload = (await response.json()) as { data?: LlamaPool[] }
  const allowedChains = new Set(['Base', 'Solana', 'Arbitrum', 'Ethereum'])
  const live = (payload.data ?? [])
    .filter((pool) => allowedChains.has(pool.chain))
    .filter((pool) => Number(pool.tvlUsd) >= 1_000_000)
    .filter((pool) => Number(pool.apy ?? pool.apyBase ?? 0) > 0.3)
    .filter((pool) => Number(pool.apy ?? pool.apyBase ?? 0) <= 22)
    .filter((pool) => /USDC|USDT|DAI|SOL|ETH|STETH/i.test(pool.symbol))
    .sort((a, b) => Number(b.tvlUsd) - Number(a.tvlUsd))
    .slice(0, 8)
    .map(poolToOpportunity)

  if (live.length === 0) throw new Error('No live pools matched the safety screen')
  return live
}

export async function scanAndCacheYields() {
  try {
    const live = await fetchLiveOpportunities()
    const opportunities = [...live, ...curatedOpportunities]
    await cacheOpportunities(opportunities)
    return { opportunities, dataStatus: 'live' as const, lastUpdated: new Date().toISOString() }
  } catch (error) {
    const cached = await getCachedOpportunities()
    const opportunities = cached.length > 0 ? cached : curatedOpportunities
    return {
      opportunities,
      dataStatus: 'fallback' as const,
      lastUpdated: new Date().toISOString(),
      fallbackReason: error instanceof Error ? error.message : 'Live scan failed',
    }
  }
}

export async function getOpportunities(filters: OpportunityFilters = {}) {
  const scan = await scanAndCacheYields()
  return {
    ...scan,
    opportunities: applyFilters(scan.opportunities, filters),
  }
}
