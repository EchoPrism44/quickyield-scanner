'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

interface TopPool {
  id: string
  platform: string
  asset: string
  chain: string
  apy: number
  tvlUsd: number
  confidence: number
  volatility: number
}

interface AnalyticsData {
  history: TimePoint[]
  chains: ChainData[]
  topPools: TopPool[]
  lastUpdated: string
}

export const dynamic = 'force-dynamic'

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({ history: [], chains: [], topPools: [], lastUpdated: new Date().toISOString() })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/analytics', { cache: 'no-store' })
      if (!response.ok) return
      const next: AnalyticsData = await response.json()
      setData(next)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const initial = setTimeout(() => {
      setMounted(true)
      void refreshData()
    }, 0)
    const interval = setInterval(refreshData, 60000)
    return () => {
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [refreshData])

  const totalTvl = useMemo(() => data.chains.reduce((sum, item) => sum + item.totalTvl, 0), [data.chains])
  const avgApy = data.history.at(-1)?.apy ?? 0
  const trackedCount = data.history.at(-1)?.count ?? data.chains.reduce((sum, item) => sum + item.opportunities, 0)

  function formatCurrency(value: number) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    return `$${Math.round(value)}`
  }

  return (
    <main className="qy-analytics">
      <div className="qy-container">
        <div className="qy-analytics-head">
          <div>
            <span className="qy-overline qy-overline-signal">Market overview</span>
            <h1 className="qy-h2">Market map</h1>
            <p className="qy-analytics-sub">A compact view for market breadth, chain exposure, top ranked pools, and APY history as snapshots accumulate.</p>
          </div>
          <div className="qy-analytics-actions">
            <Link href="/dashboard" className="qy-btn qy-btn-secondary">Back to Discover</Link>
            <button type="button" className="qy-btn qy-btn-primary" onClick={refreshData} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <section className="qy-analytics-stats">
          <article className="qy-analytics-stat">
            <span className="qy-overline">Tracked pools</span>
            <strong>{trackedCount}</strong>
            <p>Current scanner universe.</p>
          </article>
          <article className="qy-analytics-stat">
            <span className="qy-overline">Average APY</span>
            <strong>{avgApy.toFixed(2)}%</strong>
            <p>Most recent aggregate point.</p>
          </article>
          <article className="qy-analytics-stat">
            <span className="qy-overline">Total TVL</span>
            <strong>{formatCurrency(totalTvl)}</strong>
            <p>Across the active market table.</p>
          </article>
          <article className="qy-analytics-stat">
            <span className="qy-overline">Last updated</span>
            <strong>{new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            <p>Latest completed scan.</p>
          </article>
        </section>

        <section className="qy-analytics-grid">
          <article className="qy-analytics-panel">
            <div className="qy-analytics-panel-head">
              <h2>APY trend</h2>
              <span className="qy-mono">{data.history.length > 1 ? 'Stored hourly points' : 'Current point'}</span>
            </div>
            <div className="qy-analytics-chart">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={320}>
                  <LineChart data={data.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="time" stroke="#a1a1aa" fontSize={12} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                      formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, 'Avg APY']}
                    />
                    <Line type="monotone" dataKey="apy" stroke="#ff6b35" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="qy-chart-skeleton" aria-hidden="true" />}
            </div>
          </article>

          <article className="qy-analytics-panel">
            <div className="qy-analytics-panel-head">
              <h2>TVL by chain</h2>
              <span className="qy-mono">Current cache</span>
            </div>
            <div className="qy-analytics-chart">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={320}>
                  <BarChart data={data.chains}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="chain" stroke="#a1a1aa" fontSize={12} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickFormatter={(value) => formatCurrency(Number(value))} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                      formatter={(value) => [formatCurrency(Number(value ?? 0)), 'TVL']}
                    />
                    <Bar dataKey="totalTvl" fill="#16f1a3" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="qy-chart-skeleton" aria-hidden="true" />}
            </div>
          </article>
        </section>

        <section className="qy-analytics-panel">
          <div className="qy-analytics-panel-head">
            <h2>Chain comparison</h2>
            <span className="qy-mono">Current tracked set</span>
          </div>
          <div className="qy-analytics-table">
            <div className="qy-analytics-table-head">
              <span>Chain</span>
              <span>Avg APY</span>
              <span>Total TVL</span>
              <span>Pools</span>
              <span>Profile</span>
            </div>
            {data.chains.map((item) => (
              <div key={item.chain} className="qy-analytics-table-row">
                <span>{item.chain}</span>
                <span className="qy-num">{item.avgApy.toFixed(2)}%</span>
                <span className="qy-mono">{formatCurrency(item.totalTvl)}</span>
                <span className="qy-mono">{item.opportunities}</span>
                <span className={`qy-analytics-badge ${item.avgApy >= 6 ? 'warn' : 'safe'}`}>
                  {item.avgApy >= 6 ? 'Higher yield' : 'Core market'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="qy-analytics-panel">
          <div className="qy-analytics-panel-head">
            <h2>Top ranked pools</h2>
            <span className="qy-mono">Internal research pages</span>
          </div>
          <div className="qy-analytics-table">
            <div className="qy-analytics-table-head">
              <span>Pool</span>
              <span>APY</span>
              <span>TVL</span>
              <span>Safety score</span>
              <span>Volatility</span>
            </div>
            {data.topPools.length === 0 ? (
              <div className="qy-empty">
                <h3>No market scan yet</h3>
                <p>Run the scanner or open Discover to populate ranked pools and analytics.</p>
              </div>
            ) : data.topPools.map((item) => (
                <Link key={item.id} href={`/dashboard/pools/${encodeURIComponent(item.id)}`} className="qy-analytics-table-row">
                  <span>{item.platform} / {item.asset} / {item.chain}</span>
                  <span className="qy-num">{item.apy.toFixed(2)}%</span>
                  <span className="qy-mono">{formatCurrency(item.tvlUsd)}</span>
                  <span className="qy-mono">{item.confidence}</span>
                  <span className={`qy-analytics-badge ${item.volatility > 2 ? 'warn' : 'safe'}`}>
                    {item.volatility.toFixed(2)}%
                  </span>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </main>
  )
}
