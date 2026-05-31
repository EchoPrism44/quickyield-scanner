import { getOpportunities } from './opportunities'
import { formatTvl } from './scoring'
import { getAlertActivity, getAlertRules, getCachedOpportunities, getOpportunitySnapshots } from './store'
import type { AnalyticsData, MarketMapCell, Opportunity, PoolHistoryPoint, ScannerHealth } from './types'

function formatHourLabel(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

async function loadAnalyticsOpportunities() {
  let opportunities = await getCachedOpportunities()
  if (opportunities.length === 0) {
    const scan = await getOpportunities({ capital: 100000, pageSize: 100 })
    opportunities = scan.opportunities
  }
  return opportunities
}

function buildMarketMap(opportunities: Opportunity[]): MarketMapCell[] {
  const bands = [
    { band: '0-4%', minApy: 0, maxApy: 4 },
    { band: '4-8%', minApy: 4, maxApy: 8 },
    { band: '8-12%', minApy: 8, maxApy: 12 },
    { band: '12%+', minApy: 12 },
  ]

  return bands.map((band) => {
    const items = opportunities.filter((item) => item.apy >= band.minApy && (band.maxApy === undefined || item.apy < band.maxApy))
    const safetySum = items.reduce((sum, item) => sum + item.confidence, 0)
    return {
      ...band,
      pools: items.length,
      lowerRisk: items.filter((item) => item.risk === 'Low').length,
      reviewRisk: items.filter((item) => item.risk !== 'Low').length,
      totalTvl: items.reduce((sum, item) => sum + item.tvlUsd, 0),
      avgSafety: Math.round(safetySum / Math.max(items.length, 1)),
    }
  })
}

function buildScannerHealth(opportunities: Opportunity[], snapshots: Awaited<ReturnType<typeof getOpportunitySnapshots>>[]): ScannerHealth {
  const allSnapshots = snapshots.flat()
  const latestSnapshotAt = allSnapshots
    .map((item) => item.capturedAt)
    .sort()
    .at(-1)
  const since24h = Date.now() - 24 * 60 * 60 * 1000
  return {
    poolsScanned: opportunities.length,
    chainsCovered: new Set(opportunities.map((item) => item.chain)).size,
    livePools: opportunities.filter((item) => item.source === 'Live').length,
    curatedPools: opportunities.filter((item) => item.source === 'Curated').length,
    snapshots24h: allSnapshots.filter((item) => new Date(item.capturedAt).getTime() >= since24h).length,
    latestSnapshotAt,
    freshnessMinutes: latestSnapshotAt ? Math.max(0, Math.round((Date.now() - new Date(latestSnapshotAt).getTime()) / 60000)) : undefined,
  }
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const opportunities = await loadAnalyticsOpportunities()
  if (opportunities.length === 0) {
    return {
      history: [],
      chains: [],
      marketMap: [],
      scannerHealth: {
        poolsScanned: 0,
        chainsCovered: 0,
        livePools: 0,
        curatedPools: 0,
        snapshots24h: 0,
      },
      topPools: [],
      lastUpdated: new Date().toISOString(),
    }
  }

  const snapshotLists = await Promise.all(opportunities.map((item) => getOpportunitySnapshots(item.id, 48)))
  const bucket = new Map<string, { apySum: number; baseApySum: number; rewardApySum: number; tvlSum: number; count: number }>()

  for (const snapshots of snapshotLists) {
    for (const snapshot of snapshots) {
      const hourKey = snapshot.capturedAt.slice(0, 13)
      const current = bucket.get(hourKey) ?? { apySum: 0, baseApySum: 0, rewardApySum: 0, tvlSum: 0, count: 0 }
      current.apySum += snapshot.apy
      current.baseApySum += snapshot.apyBase ?? 0
      current.rewardApySum += snapshot.apyReward ?? 0
      current.tvlSum += snapshot.tvlUsd
      current.count += 1
      bucket.set(hourKey, current)
    }
  }

  let history = Array.from(bucket.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([hourKey, value]) => ({
      time: formatHourLabel(`${hourKey}:00:00.000Z`),
      apy: Number((value.apySum / Math.max(value.count, 1)).toFixed(2)),
      baseApy: Number((value.baseApySum / Math.max(value.count, 1)).toFixed(2)),
      rewardApy: Number((value.rewardApySum / Math.max(value.count, 1)).toFixed(2)),
      tvl: value.tvlSum,
      count: value.count,
    }))

  if (history.length === 0) {
    const apySum = opportunities.reduce((sum, item) => sum + item.apy, 0)
    const baseApySum = opportunities.reduce((sum, item) => sum + (item.apyBase ?? 0), 0)
    const rewardApySum = opportunities.reduce((sum, item) => sum + (item.apyReward ?? 0), 0)
    const tvlSum = opportunities.reduce((sum, item) => sum + item.tvlUsd, 0)
    history = [{
      time: 'Now',
      apy: Number((apySum / Math.max(opportunities.length, 1)).toFixed(2)),
      baseApy: Number((baseApySum / Math.max(opportunities.length, 1)).toFixed(2)),
      rewardApy: Number((rewardApySum / Math.max(opportunities.length, 1)).toFixed(2)),
      tvl: tvlSum,
      count: opportunities.length,
    }]
  }

  const chainMap = new Map<string, AnalyticsData['chains'][number]>()
  for (const op of opportunities) {
    const existing = chainMap.get(op.chain) ?? { chain: op.chain, avgApy: 0, avgSafety: 0, totalTvl: 0, opportunities: 0, lowerRisk: 0 }
    existing.avgApy = (existing.avgApy * existing.opportunities + op.apy) / (existing.opportunities + 1)
    existing.avgSafety = (existing.avgSafety * existing.opportunities + op.confidence) / (existing.opportunities + 1)
    existing.totalTvl += op.tvlUsd
    existing.opportunities += 1
    existing.lowerRisk += op.risk === 'Low' ? 1 : 0
    chainMap.set(op.chain, existing)
  }

  const chains = Array.from(chainMap.values())
    .map((item) => ({ ...item, avgApy: Number(item.avgApy.toFixed(2)), avgSafety: Math.round(item.avgSafety) }))
    .sort((a, b) => b.totalTvl - a.totalTvl)

  const lastUpdated = opportunities
    .map((item) => item.lastUpdated || item.lastSeenAt)
    .sort()
    .at(-1) ?? new Date().toISOString()

  return {
    history,
    chains,
    marketMap: buildMarketMap(opportunities),
    scannerHealth: buildScannerHealth(opportunities, snapshotLists),
    topPools: opportunities
      .slice()
      .sort((a, b) => b.confidence - a.confidence || b.tvlUsd - a.tvlUsd)
      .slice(0, 12)
      .map((item) => ({
        id: item.id,
        platform: item.platform,
        asset: item.asset,
        chain: item.chain,
        apy: item.apy,
        tvlUsd: item.tvlUsd,
        confidence: item.confidence,
        volatility: item.volatility,
      })),
    lastUpdated,
  }
}

export async function getPoolHistoryData(opportunityId: string, limit = 168): Promise<PoolHistoryPoint[]> {
  const snapshots = await getOpportunitySnapshots(opportunityId, limit)
  return snapshots.map((snapshot) => ({
    ...snapshot,
    tvlFormatted: formatTvl(snapshot.tvlUsd),
    rewardShare: Number((((snapshot.apyReward ?? 0) / Math.max(snapshot.apy, 1)) * 100).toFixed(1)),
  }))
}

export async function getAlertAnalytics(userId: string) {
  const [rules, activity] = await Promise.all([getAlertRules(userId), getAlertActivity(userId, 50)])
  const byChannel = activity.reduce<Record<string, number>>((acc, item) => {
    acc[item.channel] = (acc[item.channel] ?? 0) + 1
    return acc
  }, {})
  const byAsset = activity.reduce<Record<string, number>>((acc, item) => {
    acc[item.asset] = (acc[item.asset] ?? 0) + 1
    return acc
  }, {})

  return {
    activeRules: rules.filter((rule) => rule.enabled).length,
    pausedRules: rules.filter((rule) => !rule.enabled).length,
    deliveries: activity.length,
    byChannel,
    byAsset,
    recent: activity.slice(0, 12),
  }
}
