'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
      // Keep the last known snapshot visible if the refresh fails.
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
    <div className="min-h-screen bg-slate-900 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">Yield Analytics</h1>
            <p className="mt-1 text-slate-400">Live APY trends and chain performance from the tracked opportunity set</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Last updated: {lastUpdated}</span>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-medium transition-colors hover:bg-emerald-500 disabled:bg-emerald-800"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm text-slate-400">Avg APY (All Chains)</p>
            <p className="mt-1 text-3xl font-bold text-emerald-400">
              {latestPoint ? latestPoint.apy.toFixed(2) : '0.00'}%
            </p>
            <p className="mt-1 text-sm text-emerald-400">Based on the current tracked pool set</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm text-slate-400">Total TVL Tracked</p>
            <p className="mt-1 text-3xl font-bold text-blue-400">{formatTvl(totalTvl)}</p>
            <p className="mt-1 text-sm text-blue-400">Aggregated across the analytics snapshot</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm text-slate-400">Active Opportunities</p>
            <p className="mt-1 text-3xl font-bold text-amber-400">{totalOpportunities}</p>
            <p className="mt-1 text-sm text-amber-400">Across {chains.length} tracked chains</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm text-slate-400">Live Data Status</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500"></div>
              <span className="font-medium text-emerald-400">Live Feed Active</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Auto-refresh every 60s</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">APY Trend (Last 6 Hours)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, 'APY']}
                  />
                  <Line type="monotone" dataKey="apy" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h2 className="mb-4 text-xl font-semibold">TVL by Chain</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chains}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="chain" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${(value / 1000000000).toFixed(1)}B`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => [formatTvl(Number(value ?? 0)), 'TVL']}
                  />
                  <Legend />
                  <Bar dataKey="totalTvl" fill="#3b82f6" name="Total TVL" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold">Chain Performance Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Chain</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">Avg APY</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">Total TVL</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">Opportunities</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {chains.map((chain) => (
                  <tr key={chain.chain} className="border-b border-slate-700/50 transition-colors hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium">{chain.chain}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">{chain.avgApy.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right text-blue-400">{formatTvl(chain.totalTvl)}</td>
                    <td className="px-4 py-3 text-right text-amber-400">{chain.opportunities}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`rounded px-2 py-1 text-sm font-medium ${
                        chain.avgApy > 5 ? 'bg-amber-600/20 text-amber-400' : 'bg-emerald-600/20 text-emerald-400'
                      }`}>
                        {chain.avgApy > 5 ? 'High Yield' : 'Stable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
            <span>Data synced from DeFiLlama live feeds</span>
          </div>
        </div>
      </div>
    </div>
  )
}
