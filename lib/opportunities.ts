import { categories, chains, riskLevels, timeCosts } from './constants'
import { curatedOpportunities } from './curated'
import { getProtocolUrlIndex } from './llama-protocols'
import { cacheOpportunities, getCachedOpportunities, storeOpportunitySnapshots } from './store'
import { poolToOpportunity } from './scoring'
import { safetyGradeOf } from './grade'
import type { LlamaPool, Opportunity, OpportunityFilters } from './types'

const LIVE_FEED_TIMEOUT_MS = 15000
const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

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

  const savedIds = new Set(filters.savedIds ?? [])
  return opportunities
    .filter((item) => !q || [item.name, item.platform, item.category, item.chain, item.asset, item.symbol, item.notes].join(' ').toLowerCase().includes(q))
    .filter((item) => chain === 'All chains' || item.chain === chain)
    .filter((item) => risk === 'All risk' || item.risk === risk)
    .filter((item) => time === 'Any time' || item.time === time)
    .filter((item) => category === 'All categories' || item.category === category)
    .filter((item) => item.minimum <= capital)
    .filter((item) => !filters.preset || matchesPreset(item, filters.preset, savedIds))
    .sort((a, b) => b.confidence - a.confidence)
    .map((item, index) => ({ ...item, rank: index + 1, rankReason: getRankReason(item), safety: safetyGradeOf(item) }))
}

function matchesPreset(item: Opportunity, preset: OpportunityFilters['preset'], savedIds: Set<string>) {
  if (preset === 'saved') return savedIds.has(item.id)
  if (preset === 'safe-stablecoins') return item.risk === 'Low' && item.category === 'Stablecoin lending' && /USDC|USDT|DAI/i.test(item.asset)
  if (preset === 'eth-staking') return item.category === 'Staking' && /ETH|STETH/i.test(item.asset)
  if (preset === 'solana-yield') return item.chain === 'Solana'
  if (preset === 'high-apy') return item.apy >= 8
  return true
}

export function getRankReason(item: Opportunity) {
  if (item.risk === 'Low' && item.confidence >= 90) return 'High safety score with lower-risk screen.'
  if (item.tvlUsd >= 1_000_000_000) return 'Large TVL gives this pool stronger liquidity context.'
  if (item.volatility <= 0.5 && item.apy > 0) return 'APY has been relatively steady over the latest feed.'
  if (item.apy >= 8) return 'Higher APY, but review risk and reward quality before acting.'
  if (item.dataCompleteness >= 75) return 'Enough market-feed data to compare against similar pools.'
  return 'Included after the current safety, liquidity, and data checks.'
}

function paginate(opportunities: Opportunity[], filters: OpportunityFilters) {
  const page = Math.max(1, Math.floor(Number(filters.page) || 1))
  const requestedPageSize = Math.floor(Number(filters.pageSize) || DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedPageSize))
  const start = (page - 1) * pageSize
  return {
    opportunities: opportunities.slice(start, start + pageSize),
    total: opportunities.length,
    page,
    pageSize,
    hasMore: start + pageSize < opportunities.length,
  }
}

async function fetchLiveOpportunities() {
  const response = await fetch('https://yields.llama.fi/pools', {
    cache: 'no-store',
    signal: AbortSignal.timeout(LIVE_FEED_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Market feed returned ${response.status}`)
  const payload = (await response.json()) as { data?: LlamaPool[] }
  const live = (payload.data ?? [])
    .filter((pool) => Number(pool.tvlUsd) >= 1_000_000)
    .filter((pool) => Number(pool.apy ?? pool.apyBase ?? 0) > 0.3)
    .filter((pool) => Number(pool.apy ?? pool.apyBase ?? 0) <= 22)
    .sort((a, b) => {
      const aApy = Number(a.apy ?? a.apyBase ?? 0)
      const bApy = Number(b.apy ?? b.apyBase ?? 0)
      const aVol = Math.abs(Number(a.apyPct1D ?? 0))
      const bVol = Math.abs(Number(b.apyPct1D ?? 0))
      const aRewardShare = Number(a.apyReward ?? 0) / Math.max(aApy || 1, 1)
      const bRewardShare = Number(b.apyReward ?? 0) / Math.max(bApy || 1, 1)
      const aCompleteness = [a.apyBase, a.apyReward, a.apyPct1D, a.apyMean30d].filter((v) => v !== undefined).length
      const bCompleteness = [b.apyBase, b.apyReward, b.apyPct1D, b.apyMean30d].filter((v) => v !== undefined).length
      const aScore = Number(a.tvlUsd) / 1_000_000 + aApy * 2.5 - aVol * 8 - aRewardShare * 12 + aCompleteness * 3
      const bScore = Number(b.tvlUsd) / 1_000_000 + bApy * 2.5 - bVol * 8 - bRewardShare * 12 + bCompleteness * 3
      return bScore - aScore
    })
    .map(poolToOpportunity)
    .sort((a, b) => b.confidence - a.confidence || b.tvlUsd - a.tvlUsd)
    .map((item, index) => ({ ...item, rank: index + 1 }))

  if (live.length === 0) throw new Error('No live pools matched the safety screen')

  // Enrich pools whose protocol site we don't have from the curated catalog
  // with DeFiLlama's official URL directory (cached, best-effort).
  const urlIndex = await getProtocolUrlIndex()
  if (urlIndex.size > 0) {
    return live.map((item) => {
      if (item.officialUrl.startsWith('http')) return item
      const url = urlIndex.get(item.protocolSlug)
      return url ? { ...item, officialUrl: url, actionUrl: url, sourceUrl: url } : item
    })
  }
  return live
}

export async function scanAndCacheYields() {
  try {
    const live = await fetchLiveOpportunities()
    const opportunities = [...live, ...curatedOpportunities]
    try {
      await cacheOpportunities(opportunities)
      await storeOpportunitySnapshots(opportunities)
    } catch (error) {
      return {
        opportunities,
        dataStatus: 'live' as const,
        lastUpdated: new Date().toISOString(),
        fallbackReason: `Storage unavailable: ${errorMessage(error, 'Cache update failed')}`,
      }
    }
    return { opportunities, dataStatus: 'live' as const, lastUpdated: new Date().toISOString() }
  } catch (error) {
    try {
      const cached = await getCachedOpportunities()
      const opportunities = cached.length > 0 ? cached : curatedOpportunities
      return {
        opportunities,
        dataStatus: 'fallback' as const,
        lastUpdated: new Date().toISOString(),
        fallbackReason: errorMessage(error, 'Market scan failed'),
      }
    } catch (cacheError) {
      return {
        opportunities: curatedOpportunities,
        dataStatus: 'fallback' as const,
        lastUpdated: new Date().toISOString(),
        fallbackReason: `${errorMessage(error, 'Market scan failed')}; cache unavailable: ${errorMessage(cacheError, 'Cache read failed')}`,
      }
    }
  }
}

export async function getOpportunities(filters: OpportunityFilters = {}) {
  const scan = await scanAndCacheYields()
  const filtered = applyFilters(scan.opportunities, filters)
  return {
    ...scan,
    ...paginate(filtered, filters),
  }
}
