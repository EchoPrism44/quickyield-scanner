'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'F'

interface TimePoint {
  time: string
  apy: number
  baseApy: number
  rewardApy: number
  tvl: number
  count: number
}

interface ChainData {
  chain: string
  avgApy: number
  avgSafety: number
  totalTvl: number
  opportunities: number
  lowerRisk: number
}

interface GradeBucket {
  letter: GradeLetter
  count: number
  pct: number
}

interface MoverRow {
  id: string
  platform: string
  asset: string
  chain: string
  apy: number
  grade?: GradeLetter
  change: number
}

interface StabilityRow {
  id: string
  platform: string
  asset: string
  chain: string
  apy: number
  grade?: GradeLetter
  volatility: number
}

interface AnalyticsData {
  history: TimePoint[]
  chains: ChainData[]
  marketMap: Array<{ band: string; pools: number; lowerRisk: number; reviewRisk: number; totalTvl: number; avgSafety: number }>
  scannerHealth: {
    poolsScanned: number
    chainsCovered: number
    livePools: number
    curatedPools: number
    snapshots24h: number
    latestSnapshotAt?: string
    freshnessMinutes?: number
  }
  topPools: Array<{ id: string; platform: string; asset: string; chain: string; apy: number; tvlUsd: number; confidence: number; volatility: number }>
  gradeDistribution: GradeBucket[]
  apyGainers: MoverRow[]
  apyLosers: MoverRow[]
  tvlOutflows: MoverRow[]
  mostStable: StabilityRow[]
  leastStable: StabilityRow[]
  lastUpdated: string
}

const EMPTY: AnalyticsData = {
  history: [],
  chains: [],
  marketMap: [],
  scannerHealth: { poolsScanned: 0, chainsCovered: 0, livePools: 0, curatedPools: 0, snapshots24h: 0 },
  topPools: [],
  gradeDistribution: [],
  apyGainers: [],
  apyLosers: [],
  tvlOutflows: [],
  mostStable: [],
  leastStable: [],
  lastUpdated: new Date().toISOString(),
}

const GRADE_COLOR: Record<GradeLetter, string> = {
  A: '#34d399',
  B: '#38d5ff',
  C: '#f59e0b',
  D: '#fb923c',
  F: '#f87171',
}

export const dynamic = 'force-dynamic'

function GradeTag({ grade }: { grade?: GradeLetter }) {
  if (!grade) return <span className="qy-mono" style={{ color: '#8baabf' }}>—</span>
  return (
    <span
      className="qy-mono"
      style={{ display: 'inline-flex', minWidth: 22, justifyContent: 'center', padding: '1px 7px', borderRadius: 6, fontWeight: 700, color: '#050a12', backgroundColor: GRADE_COLOR[grade] }}
    >
      {grade}
    </span>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/analytics', { cache: 'no-store' })
      if (!response.ok) return
      const next: AnalyticsData = await response.json()
      setData({ ...EMPTY, ...next })
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
  const trackedCount = data.scannerHealth.poolsScanned || data.chains.reduce((sum, item) => sum + item.opportunities, 0)
  const safeShare = useMemo(() => {
    const total = data.gradeDistribution.reduce((sum, b) => sum + b.count, 0)
    const safe = data.gradeDistribution.filter((b) => b.letter === 'A' || b.letter === 'B').reduce((sum, b) => sum + b.count, 0)
    return total ? Math.round((safe / total) * 100) : 0
  }, [data.gradeDistribution])
  const maxGrade = Math.max(1, ...data.gradeDistribution.map((b) => b.count))

  function formatCurrency(value: number) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    return `$${Math.round(value)}`
  }

  const hasData = trackedCount > 0

  return (
    <main className="qy-analytics">
      <div className="qy-container">
        <div className="qy-analytics-head">
          <div>
            <span className="qy-overline qy-overline-signal">Market intelligence</span>
            <h1 className="qy-h2">What changed this week</h1>
            <p className="qy-analytics-sub">Safety-grade mix, the biggest yield and liquidity moves, and which pools held steadiest — built from QuickYield&apos;s own accumulating snapshots.</p>
          </div>
          <div className="qy-analytics-actions">
            <Link href="/terminal" className="qy-btn qy-btn-secondary">Back to Discover</Link>
            <button type="button" className="qy-btn qy-btn-primary" onClick={refreshData} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <section className="qy-analytics-stats">
          <article className="qy-analytics-stat">
            <span className="qy-overline">Tracked pools</span>
            <strong>{trackedCount}</strong>
            <p>{data.scannerHealth.chainsCovered || data.chains.length} chains covered.</p>
          </article>
          <article className="qy-analytics-stat">
            <span className="qy-overline">Safer-grade share</span>
            <strong>{safeShare}%</strong>
            <p>Pools graded A or B right now.</p>
          </article>
          <article className="qy-analytics-stat">
            <span className="qy-overline">Average APY</span>
            <strong>{avgApy.toFixed(2)}%</strong>
            <p>Base {data.history.at(-1)?.baseApy?.toFixed(2) ?? '0.00'}% / rewards {data.history.at(-1)?.rewardApy?.toFixed(2) ?? '0.00'}%.</p>
          </article>
          <article className="qy-analytics-stat">
            <span className="qy-overline">Snapshots 24h</span>
            <strong>{data.scannerHealth.snapshots24h}</strong>
            <p>{data.scannerHealth.freshnessMinutes === undefined ? 'History grows every scan.' : `${data.scannerHealth.freshnessMinutes} min since latest.`}</p>
          </article>
        </section>

        {/* Grade distribution — the headline metric */}
        <section className="qy-analytics-panel">
          <div className="qy-analytics-panel-head">
            <h2>Safety grade distribution</h2>
            <span className="qy-mono">{hasData ? `${trackedCount} pools` : 'Awaiting scan'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {data.gradeDistribution.map((bucket) => (
              <div key={bucket.letter} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <GradeTag grade={bucket.letter} />
                <div style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${(bucket.count / maxGrade) * 100}%`, height: '100%', backgroundColor: GRADE_COLOR[bucket.letter], borderRadius: 7, transition: 'width .4s ease' }} />
                </div>
                <span className="qy-mono" style={{ width: 96, textAlign: 'right' }}>{bucket.count} · {bucket.pct}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* Movers — what changed */}
        <section className="qy-analytics-grid">
          <article className="qy-analytics-panel">
            <div className="qy-analytics-panel-head">
              <h2>APY gainers</h2>
              <span className="qy-mono">24h change</span>
            </div>
            <div className="qy-analytics-table">
              {data.apyGainers.length === 0 ? (
                <div className="qy-empty"><p>No upward APY moves in the latest scan.</p></div>
              ) : data.apyGainers.map((row) => (
                <Link key={row.id} href={`/terminal/pools/${encodeURIComponent(row.id)}`} className="qy-analytics-table-row" style={{ gridTemplateColumns: '1fr auto auto auto', textDecoration: 'none' }}>
                  <span>{row.platform} / {row.asset} / {row.chain}</span>
                  <GradeTag grade={row.grade} />
                  <span className="qy-num">{row.apy.toFixed(2)}%</span>
                  <span className="qy-num" style={{ color: '#34d399' }}>+{row.change.toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </article>

          <article className="qy-analytics-panel">
            <div className="qy-analytics-panel-head">
              <h2>APY losers</h2>
              <span className="qy-mono">24h change</span>
            </div>
            <div className="qy-analytics-table">
              {data.apyLosers.length === 0 ? (
                <div className="qy-empty"><p>No downward APY moves in the latest scan.</p></div>
              ) : data.apyLosers.map((row) => (
                <Link key={row.id} href={`/terminal/pools/${encodeURIComponent(row.id)}`} className="qy-analytics-table-row" style={{ gridTemplateColumns: '1fr auto auto auto', textDecoration: 'none' }}>
                  <span>{row.platform} / {row.asset} / {row.chain}</span>
                  <GradeTag grade={row.grade} />
                  <span className="qy-num">{row.apy.toFixed(2)}%</span>
                  <span className="qy-num" style={{ color: '#f87171' }}>{row.change.toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </article>
        </section>

        {/* TVL outflows + stability */}
        <section className="qy-analytics-grid">
          <article className="qy-analytics-panel">
            <div className="qy-analytics-panel-head">
              <h2>Liquidity leaving</h2>
              <span className="qy-mono">TVL since first snapshot</span>
            </div>
            <div className="qy-analytics-table">
              {data.tvlOutflows.length === 0 ? (
                <div className="qy-empty"><p>No notable TVL outflows yet — this fills in as snapshots accumulate.</p></div>
              ) : data.tvlOutflows.map((row) => (
                <Link key={row.id} href={`/terminal/pools/${encodeURIComponent(row.id)}`} className="qy-analytics-table-row" style={{ gridTemplateColumns: '1fr auto auto', textDecoration: 'none' }}>
                  <span>{row.platform} / {row.asset} / {row.chain}</span>
                  <GradeTag grade={row.grade} />
                  <span className="qy-num" style={{ color: '#f87171' }}>{row.change.toFixed(1)}%</span>
                </Link>
              ))}
            </div>
          </article>

          <article className="qy-analytics-panel">
            <div className="qy-analytics-panel-head">
              <h2>Steadiest yields</h2>
              <span className="qy-mono">Lowest volatility</span>
            </div>
            <div className="qy-analytics-table">
              {data.mostStable.length === 0 ? (
                <div className="qy-empty"><p>Stability ranks appear once pools are scanned.</p></div>
              ) : data.mostStable.map((row) => (
                <Link key={row.id} href={`/terminal/pools/${encodeURIComponent(row.id)}`} className="qy-analytics-table-row" style={{ gridTemplateColumns: '1fr auto auto auto', textDecoration: 'none' }}>
                  <span>{row.platform} / {row.asset} / {row.chain}</span>
                  <GradeTag grade={row.grade} />
                  <span className="qy-num">{row.apy.toFixed(2)}%</span>
                  <span className="qy-analytics-badge safe">{row.volatility.toFixed(2)}%</span>
                </Link>
              ))}
            </div>
          </article>
        </section>

        {/* APY history — the accumulating-data moat */}
        <section className="qy-analytics-panel">
          <div className="qy-analytics-panel-head">
            <h2>Market APY over time</h2>
            <span className="qy-mono">{data.history.length > 1 ? 'Stored hourly points' : 'Current point'}</span>
          </div>
          <div className="qy-analytics-chart">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={300}>
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
        </section>

        {/* Secondary: market map + scanner health */}
        <section className="qy-analytics-grid">
          <article className="qy-analytics-panel">
            <div className="qy-analytics-panel-head">
              <h2>APY band breadth</h2>
              <span className="qy-mono">Pools by APY band</span>
            </div>
            <div className="qy-analytics-market-map">
              {data.marketMap.map((cell, index) => (
                <div key={cell.band} className={`qy-market-map-cell heat-${index}`}>
                  <span className="qy-overline">{cell.band}</span>
                  <strong>{cell.pools}</strong>
                  <small>{cell.lowerRisk} lower risk / {cell.avgSafety || '--'} safety</small>
                </div>
              ))}
            </div>
          </article>

          <article className="qy-analytics-panel">
            <div className="qy-analytics-panel-head">
              <h2>Scanner health</h2>
              <span className="qy-mono">{new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="qy-health-grid">
              <div><span>Live pools</span><strong>{data.scannerHealth.livePools}</strong></div>
              <div><span>Curated fallback</span><strong>{data.scannerHealth.curatedPools}</strong></div>
              <div><span>Chains</span><strong>{data.scannerHealth.chainsCovered}</strong></div>
              <div><span>Tracked TVL</span><strong>{formatCurrency(totalTvl)}</strong></div>
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
      </div>
    </main>
  )
}
