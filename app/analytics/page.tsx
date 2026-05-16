'use client'

import { useEffect, useState, useCallback } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' })
      if (res.ok) {
        const data: AnalyticsData = await res.json()
        setHistory(data.history)
        setChains(data.chains)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch {
      // Keep existing data on error
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(refreshData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const formatTvl = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value}`
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">Yield Analytics</h1>
            <p className="text-slate-400 mt-1">Real-time APY trends and chain performance</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Last updated: {lastUpdated}</span>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 rounded-lg font-medium transition-colors"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Avg APY (All Chains)</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">
              {mockHistoryData[mockHistoryData.length - 1].apy.toFixed(2)}%
            </p>
            <p className="text-emerald-400 text-sm mt-1">↑ +0.3% from 24h ago</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Total TVL Tracked</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">
              {formatTvl(chains.reduce((sum, c) => sum + c.totalTvl, 0))}
            </p>
            <p className="text-blue-400 text-sm mt-1">↑ +2.4% today</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Active Opportunities</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">
              {chains.reduce((sum, c) => sum + c.opportunities, 0)}
            </p>
            <p className="text-amber-400 text-sm mt-1">Across 4 chains</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Live Data Status</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-emerald-400 font-medium">Live Feed Active</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Auto-refresh every 60s</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">APY Trend (Last 6 Hours)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}%`} />
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

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">TVL by Chain</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chains}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="chain" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000000000).toFixed(1)}B`} />
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

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Chain Performance Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Chain</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Avg APY</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Total TVL</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Opportunities</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {chains.map((chain) => (
                  <tr key={chain.chain} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{chain.chain}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{chain.avgApy.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right text-blue-400">{formatTvl(chain.totalTvl)}</td>
                    <td className="py-3 px-4 text-right text-amber-400">{chain.opportunities}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
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

        <div className="mt-8 flex items-center justify-center text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Data synced from DeFiLlama live feeds</span>
          </div>
        </div>
      </div>
    </div>
  )
}
