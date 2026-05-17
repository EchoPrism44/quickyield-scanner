'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

interface AnalyticsData {
  history: TimePoint[]
  chains: ChainData[]
  lastUpdated: string
}

const mockHistoryData: TimePoint[] = [
  { time: '6h ago', apy: 4.2, tvl: 1200000, count: 8 },
  { time: '5h ago', apy: 4.5, tvl: 1250000, count: 9 },
  { time: '4h ago', apy: 4.1, tvl: 1180000, count: 7 },
  { time: '3h ago', apy: 4.8, tvl: 1320000, count: 10 },
  { time: '2h ago', apy: 4.3, tvl: 1280000, count: 8 },
  { time: '1h ago', apy: 4.6, tvl: 1350000, count: 9 },
  { time: 'Now', apy: 4.7, tvl: 1380000, count: 8 },
]

const mockChainData: ChainData[] = [
  { chain: 'Ethereum', avgApy: 3.8, totalTvl: 850000000, opportunities: 45 },
  { chain: 'Base', avgApy: 5.2, totalTvl: 420000000, opportunities: 28 },
  { chain: 'Solana', avgApy: 6.1, totalTvl: 280000000, opportunities: 32 },
  { chain: 'Arbitrum', avgApy: 4.5, totalTvl: 310000000, opportunities: 24 },
]

export default function AnalyticsPage() {
  const [history, setHistory] = useState<TimePoint[]>(mockHistoryData)
  const [chains, setChains] = useState<ChainData[]>(mockChainData)
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const latestPoint = history[history.length - 1]
  const totalTvl = chains.reduce((sum, chain) => sum + chain.totalTvl, 0)
  const totalOpportunities = chains.reduce((sum, chain) => sum + chain.opportunities, 0)

  async function refreshData() {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' })
      if (!res.ok) return

      const data: AnalyticsData = await res.json()
      if (data.history.length > 0) setHistory(data.history)
      if (data.chains.length > 0) setChains(data.chains)
      setLastUpdated(new Date(data.lastUpdated).toLocaleTimeString())
    } catch {
      // Keep the last known snapshot visible if refresh fails.
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const initialRefresh = setTimeout(() => { void refreshData() }, 0)
    const interval = setInterval(refreshData, 60000)
    return () => {
      clearTimeout(initialRefresh)
      clearInterval(interval)
    }
  }, [])

  function formatTvl(value: number) {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value}`
  }

  return (
    <main className="qy-analytics">
      <div className="qy-container">
        <div className="qy-analytics-head">
          <div>
            <span className="qy-overline qy-overline-signal">Analytics</span>
            <h1 className="qy-h2">Yield Analytics</h1>
            <p className="qy-analytics-sub">Live APY trends and chain performance from the tracked opportunity set.</p>
          </div>
          <div className="qy-analytics-actions">
            <span className="qy-mono qy-analytics-updated">Updated {lastUpdated}</span>
            <button
              type="button"
              className="qy-btn qy-btn-primary"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <section className="qy-analytics-stats">
          <article className="qy-analytics-stat">
            <span className="qy-overline">Avg APY</span>
            <strong>{latestPoint ? latestPoint.apy.toFixed(2) : '0.00'}%</strong>
            <p>Based on the current tracked pool set.</p>
          </article>
          <article className="qy-analytics-stat">
            <span className="qy-overline">Total TVL</span>
            <strong>{formatTvl(totalTvl)}</strong>
            <p>Aggregated across the analytics snapshot.</p>
          </article>
          <article className="qy-analytics-stat">
            <span className="qy-overline">Opportunities</span>
            <strong>{totalOpportunities}</strong>
            <p>Across {chains.length} tracked chains.</p>
          </article>
          <article className="qy-analytics-stat">
            <span className="qy-overline">Feed Status</span>
            <strong>Live</strong>
            <p>Auto-refresh every 60 seconds.</p>
          </article>
        </section>

        <section className="qy-analytics-grid">
          <article className="qy-analytics-panel">
            <div className="qy-analytics-panel-head">
              <h2>APY Trend</h2>
              <span className="qy-mono">Last 6 hours</span>
            </div>
            <div className="qy-analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="time" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    labelStyle={{ color: '#f4f4f5' }}
                    formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, 'APY']}
                  />
                  <Line type="monotone" dataKey="apy" stroke="#ff4500" strokeWidth={3} dot={{ fill: '#ff4500' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="qy-analytics-panel">
            <div className="qy-analytics-panel-head">
              <h2>TVL by Chain</h2>
              <span className="qy-mono">Current snapshot</span>
            </div>
            <div className="qy-analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chains}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="chain" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickFormatter={(value) => `$${(value / 1000000000).toFixed(1)}B`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    labelStyle={{ color: '#f4f4f5' }}
                    formatter={(value) => [formatTvl(Number(value ?? 0)), 'TVL']}
                  />
                  <Legend />
                  <Bar dataKey="totalTvl" fill="#00e599" radius={[8, 8, 0, 0]} name="Total TVL" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="qy-analytics-panel">
          <div className="qy-analytics-panel-head">
            <h2>Chain Performance Comparison</h2>
            <span className="qy-mono">Current ranking</span>
          </div>
          <div className="qy-analytics-table">
            <div className="qy-analytics-table-head">
              <span>Chain</span>
              <span>Avg APY</span>
              <span>Total TVL</span>
              <span>Opportunities</span>
              <span>Profile</span>
            </div>
            {chains.map((chain) => (
              <div key={chain.chain} className="qy-analytics-table-row">
                <span>{chain.chain}</span>
                <span className="qy-num">{chain.avgApy.toFixed(2)}%</span>
                <span className="qy-mono">{formatTvl(chain.totalTvl)}</span>
                <span className="qy-mono">{chain.opportunities}</span>
                <span className={`qy-analytics-badge ${chain.avgApy > 5 ? 'warn' : 'safe'}`}>
                  {chain.avgApy > 5 ? 'High Yield' : 'Stable'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
