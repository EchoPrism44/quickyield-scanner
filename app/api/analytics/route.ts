import { NextResponse } from 'next/server'
import { getCachedOpportunities, getOpportunitySnapshots } from '../../../lib/store'
import { getOpportunities } from '../../../lib/opportunities'
import type { Opportunity } from '../../../lib/types'

export const dynamic = 'force-dynamic'

interface TimePoint {
  time: string
  apy: number
  tvl: number
  count: number
}

interface ChainData {
  chain: string
  avgApy: number
  totalTvl: number
  opportunities: number
}

type TopPool = Pick<Opportunity, 'id' | 'platform' | 'asset' | 'chain' | 'apy' | 'tvlUsd' | 'confidence' | 'volatility'>

function formatHourLabel(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export async function GET() {
  let opportunities = await getCachedOpportunities()
  if (opportunities.length === 0) {
    const scan = await getOpportunities({ capital: 100000 })
    opportunities = scan.opportunities
  }

  if (opportunities.length === 0) {
    return NextResponse.json({
      history: [],
      chains: [],
      topPools: [],
      lastUpdated: new Date().toISOString(),
    })
  }

  const snapshotLists = await Promise.all(opportunities.map((item) => getOpportunitySnapshots(item.id, 24)))
  const bucket = new Map<string, { apySum: number; tvlSum: number; count: number }>()

  for (const snapshots of snapshotLists) {
    for (const snapshot of snapshots) {
      const hourKey = snapshot.capturedAt.slice(0, 13)
      const current = bucket.get(hourKey) ?? { apySum: 0, tvlSum: 0, count: 0 }
      current.apySum += snapshot.apy
      current.tvlSum += snapshot.tvlUsd
      current.count += 1
      bucket.set(hourKey, current)
    }
  }

  let history: TimePoint[] = Array.from(bucket.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([hourKey, value]) => ({
      time: formatHourLabel(`${hourKey}:00:00.000Z`),
      apy: Number((value.apySum / Math.max(value.count, 1)).toFixed(2)),
      tvl: value.tvlSum,
      count: value.count,
    }))

  if (history.length === 0) {
    const apySum = opportunities.reduce((sum, item) => sum + item.apy, 0)
    const tvlSum = opportunities.reduce((sum, item) => sum + item.tvlUsd, 0)
    history = [{
      time: 'Now',
      apy: Number((apySum / Math.max(opportunities.length, 1)).toFixed(2)),
      tvl: tvlSum,
      count: opportunities.length,
    }]
  }

  const chainMap = new Map<string, ChainData>()
  for (const op of opportunities) {
    const existing = chainMap.get(op.chain) ?? { chain: op.chain, avgApy: 0, totalTvl: 0, opportunities: 0 }
    existing.avgApy = (existing.avgApy * existing.opportunities + op.apy) / (existing.opportunities + 1)
    existing.totalTvl += op.tvlUsd
    existing.opportunities += 1
    chainMap.set(op.chain, existing)
  }

  const chains = Array.from(chainMap.values()).sort((a, b) => b.totalTvl - a.totalTvl)
  const lastUpdated = opportunities
    .map((item) => item.lastUpdated || item.lastSeenAt)
    .sort()
    .at(-1) ?? new Date().toISOString()

  return NextResponse.json({
    history,
    chains,
    topPools: opportunities
      .slice()
      .sort((a, b) => b.confidence - a.confidence || b.tvlUsd - a.tvlUsd)
      .slice(0, 12)
      .map((item): TopPool => ({
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
  })
}
