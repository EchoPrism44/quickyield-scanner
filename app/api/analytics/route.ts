import { NextResponse } from 'next/server'
import { getCachedOpportunities, getOpportunitySnapshots } from '../../../lib/store'

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

function formatHourLabel(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export async function GET() {
  const opportunities = await getCachedOpportunities()

  if (opportunities.length === 0) {
    return NextResponse.json({
      history: [],
      chains: [],
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

  const history: TimePoint[] = Array.from(bucket.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([hourKey, value]) => ({
      time: formatHourLabel(`${hourKey}:00:00.000Z`),
      apy: Number((value.apySum / Math.max(value.count, 1)).toFixed(2)),
      tvl: value.tvlSum,
      count: value.count,
    }))

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
    lastUpdated,
  })
}
