'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Bookmark, Filter, Search, SlidersHorizontal } from 'lucide-react'
import { categories, chains, timeCosts } from '../../lib/constants'
import { ProtocolLogo } from '../protocol-logo'
import { GradeChip, SparklineCell } from './shared'
import type { DashboardData, Opportunity, OpportunityPreset } from '../../lib/types'

const presetItems: { key: OpportunityPreset | 'all'; label: string }[] = [
  { key: 'all', label: 'All pools' },
  { key: 'safe-stablecoins', label: 'Safer stablecoins' },
  { key: 'eth-staking', label: 'ETH staking' },
  { key: 'solana-yield', label: 'Solana yield' },
  { key: 'high-apy', label: 'High APY' },
  { key: 'saved', label: 'Saved' },
]

export function DiscoverView({
  data,
  watched,
  chain,
  risk,
  time,
  category,
  query,
  preset,
  advancedOpen,
  onPreset,
  onAdvancedOpen,
  onChain,
  onRisk,
  onTime,
  onCategory,
  onQuery,
  onToggleWatch,
  onCreateAlert,
  onLoadMore,
  triggeredAlerts,
}: {
  data: DashboardData
  watched: Set<string>
  chain: string
  risk: string
  time: string
  category: string
  query: string
  preset: OpportunityPreset | 'all'
  advancedOpen: boolean
  onPreset: (value: OpportunityPreset | 'all') => void
  onAdvancedOpen: () => void
  onChain: (value: string) => void
  onRisk: (value: string) => void
  onTime: (value: string) => void
  onCategory: (value: string) => void
  onQuery: (value: string) => void
  onToggleWatch: (id: string) => Promise<void>
  onCreateAlert: (item: Opportunity) => void
  onLoadMore: () => void
  triggeredAlerts: number
}) {
  const [sortBy, setSortBy] = useState<'confidence' | 'apy' | 'tvl' | 'volatility' | 'updated'>('confidence')
  const [heatmapMetric, setHeatmapMetric] = useState<'apy' | 'safety'>('apy')

  const sorted = useMemo(() => {
    const items = [...data.opportunities]
    items.sort((a, b) => {
      if (sortBy === 'apy') return b.apy - a.apy
      if (sortBy === 'tvl') return b.tvlUsd - a.tvlUsd
      if (sortBy === 'volatility') return a.volatility - b.volatility
      if (sortBy === 'updated') return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      return b.confidence - a.confidence
    })
    return items
  }, [data.opportunities, sortBy])

  const saferCount = data.opportunities.filter((item) => item.risk === 'Low').length
  const stableAssets = new Set(['USDC', 'USDT', 'DAI', 'USDS', 'USDE', 'FRAX', 'LUSD', 'PYUSD'])
  const stablecoinBest = data.opportunities
    .filter((item) => item.category.toLowerCase().includes('stable') || stableAssets.has(item.asset.toUpperCase()))
    .sort((a, b) => b.apy - a.apy)[0]
  const highestApy = [...data.opportunities].sort((a, b) => b.apy - a.apy)[0]
  const lastScan = new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const marketBands = ['0-4%', '4-8%', '8-12%', '12%+'].map((band) => {
    const [min, max] = band === '12%+' ? [12, Infinity] : band.replace('%', '').split('-').map(Number)
    const items = data.opportunities.filter((item) => item.apy >= min && item.apy < max)
    const low = items.filter((item) => item.risk === 'Low').length
    const avgSafety = items.length ? Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / items.length) : 0
    return { band, items, low, avgSafety }
  })
  const scannerUpdates = [
    stablecoinBest ? `Stablecoin leader: ${stablecoinBest.asset} on ${stablecoinBest.platform} at ${stablecoinBest.apy.toFixed(2)}% APY` : 'Stablecoin leader will appear after the next scan.',
    highestApy ? `Highest current APY: ${highestApy.asset} on ${highestApy.chain} at ${highestApy.apy.toFixed(2)}%` : 'Highest APY will appear after the next scan.',
    `${saferCount} lower-risk pools match the current view.`,
    data.fallbackReason ? `Fallback feed active: ${data.fallbackReason}` : `Live scanner refreshed at ${lastScan}.`,
  ]

  return (
    <section className="qy-page qy-terminal-page" data-testid="discover-page">
      <div className="qy-page-header qy-terminal-header">
        <div>
          <span className="qy-overline qy-overline-signal">Yield radar</span>
          <h1>Discover</h1>
          <p>Scan live pools, understand why they rank, save candidates, and set target alerts.</p>
        </div>
        <div className="qy-terminal-kpis">
          <div className="qy-terminal-kpi"><span className="qy-overline">Best stablecoin yield</span><strong>{stablecoinBest ? `${stablecoinBest.apy.toFixed(2)}%` : '--'}</strong></div>
          <div className="qy-terminal-kpi"><span className="qy-overline">Highest APY</span><strong>{highestApy ? `${highestApy.apy.toFixed(2)}%` : '--'}</strong></div>
          <div className="qy-terminal-kpi"><span className="qy-overline">Pools scanned</span><strong>{data.total}</strong></div>
          <div className="qy-terminal-kpi"><span className="qy-overline">Triggered alerts</span><strong>{triggeredAlerts}</strong></div>
        </div>
      </div>

      <div className="qy-discover-summary" aria-label="Current scan summary">
        <div><span className="qy-overline">Loaded now</span><strong>{data.opportunities.length} of {data.total}</strong></div>
        <div><span className="qy-overline">Matched safer pools</span><strong>{saferCount}</strong></div>
        <div><span className="qy-overline">Last scan</span><strong>{lastScan}</strong></div>
        <div><span className="qy-overline">Data source</span><strong>{data.dataStatus === 'live' ? 'Live' : 'Fallback'}</strong></div>
      </div>

      <div className="qy-signal-path" aria-label="How QuickYield ranks and alerts">
        <div>
          <span className="qy-overline">Scanned</span>
          <strong>500+ pools across major chains</strong>
        </div>
        <div>
          <span className="qy-overline">Shown because</span>
          <strong>APY, TVL, risk, and data checks match this view</strong>
        </div>
        <div>
          <span className="qy-overline">Alert when</span>
          <strong>Your asset, APY, chain, and risk rule matches</strong>
        </div>
      </div>

      <div className="qy-preset-bar" aria-label="Yield radar presets">
        {presetItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`qy-chip ${preset === item.key ? 'active-signal' : ''}`}
            onClick={() => onPreset(item.key)}
            aria-pressed={preset === item.key}
          >
            {item.key === 'saved' ? <Bookmark size={13} /> : null}
            {item.label}
          </button>
        ))}
      </div>

      <div className="qy-filters qy-terminal-filters" data-testid="filters">
        <label className="qy-search-field">
          <span><Search size={14} /> Search</span>
          <input className="qy-input qy-market-search" placeholder="Pool, asset, protocol" value={query} onChange={(event) => onQuery(event.target.value)} />
        </label>
        <label>
          <span>Chain</span>
          <select className="qy-input" value={chain} onChange={(event) => onChain(event.target.value)}>{chains.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        </label>
        <button type="button" className="qy-btn qy-btn-secondary qy-btn-sm" onClick={onAdvancedOpen} aria-expanded={advancedOpen}>
          <SlidersHorizontal size={14} />
          Advanced filters
        </button>
        {advancedOpen ? (
          <div className="qy-advanced-filters">
            <label>
              <span>Category</span>
              <select className="qy-input" value={category} onChange={(event) => onCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            </label>
            <label>
              <span>Risk</span>
              <select className="qy-input" value={risk} onChange={(event) => onRisk(event.target.value)}>
                {['All risk', 'Low', 'Medium'].map((item) => <option key={item} value={item}>{item === 'Low' ? 'Lower risk only' : item}</option>)}
              </select>
            </label>
            <label>
              <span>Time</span>
              <select className="qy-input" value={time} onChange={(event) => onTime(event.target.value)}>{timeCosts.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            </label>
          </div>
        ) : null}
      </div>

      <div className="qy-intel-grid">
        <section className="qy-heatmap-panel" aria-label="Yield heatmap">
          <div className="qy-intel-panel-head">
            <div>
              <span className="qy-overline">Market map</span>
              <h2>Yield heatmap</h2>
            </div>
            <div className="qy-segmented-control" aria-label="Heatmap metric">
              {(['apy', 'safety'] as const).map((metric) => (
                <button
                  key={metric}
                  type="button"
                  className={heatmapMetric === metric ? 'active' : ''}
                  onClick={() => setHeatmapMetric(metric)}
                  aria-pressed={heatmapMetric === metric}
                >
                  {metric === 'apy' ? 'APY' : 'Safety'}
                </button>
              ))}
            </div>
          </div>
          <div className="qy-market-map">
            {marketBands.map(({ band, items, low, avgSafety }, index) => (
              <div key={band} className={`qy-market-map-cell heat-${index}`}>
                <span className="qy-overline">{band} APY</span>
                <strong>{heatmapMetric === 'apy' ? items.length : avgSafety || '--'}</strong>
                <small>{heatmapMetric === 'apy' ? `${low} lower risk` : `${items.length} pools sampled`}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="qy-intel-feed" aria-label="Scanner signal stream">
          <div className="qy-intel-panel-head">
            <div>
              <span className="qy-overline">Scanner feed</span>
              <h2>Signal stream</h2>
            </div>
            <span className={`qy-feed-status ${data.dataStatus === 'live' ? 'live' : 'fallback'}`}>{data.dataStatus}</span>
          </div>
          <div className="qy-feed-list">
            {scannerUpdates.map((update, index) => (
              <div key={update} className="qy-feed-row">
                <span className="qy-feed-time">T-{index + 1}</span>
                <p>{update}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="qy-terminal-table-wrap qy-desktop-results">
        <div className="qy-terminal-table-head">
          <span>Protocol</span>
          <span>Asset</span>
          <button type="button" className={`qy-sort-link ${sortBy === 'apy' ? 'active' : ''}`} onClick={() => setSortBy('apy')}>APY</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'volatility' ? 'active' : ''}`} onClick={() => setSortBy('volatility')}>24h Change</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'tvl' ? 'active' : ''}`} onClick={() => setSortBy('tvl')}>TVL</button>
          <span>Grade</span>
          <span>Chain</span>
          <span>Action</span>
        </div>

        {sorted.length === 0 ? (
          <div className="qy-empty qy-table-empty-state">
            <Filter className="qy-empty-icon" />
            <h3>No pools match this view</h3>
            <p>Try another preset, widen risk, or search for a different asset.</p>
          </div>
        ) : sorted.map((item) => (
          <div key={item.id} className="qy-terminal-row">
            <Link href={`/terminal/pools/${encodeURIComponent(item.id)}`} className="qy-terminal-pool">
              <ProtocolLogo name={item.platform} logoUrl={item.logoUrl} />
              <div className="qy-terminal-pool-copy">
                <div className="qy-asset-name">
                  <span>{item.platform}</span>
                </div>
                <div className="qy-rank-reason">{item.rankReason}</div>
              </div>
            </Link>

            <div className="qy-terminal-metric">
              <strong>{item.asset}</strong>
              <span className="qy-terminal-submetric">{item.category}</span>
            </div>
            <div className="qy-terminal-metric">
              <strong>{item.apy.toFixed(2)}%</strong>
              <SparklineCell poolId={item.id} />
            </div>
            <div className="qy-terminal-metric">
              <strong>{item.volatility.toFixed(2)}%</strong>
              <span className="qy-terminal-submetric">24h move</span>
            </div>
            <div className="qy-terminal-metric qy-terminal-right"><strong>{item.tvl}</strong></div>
            <div className="qy-terminal-metric">
              <GradeChip item={item} />
              <span className="qy-terminal-submetric">{item.risk === 'Low' ? 'Lower risk' : 'Review carefully'}</span>
            </div>
            <div className="qy-terminal-metric">
              <strong>{item.chain}</strong>
            </div>
            <div className="qy-terminal-actions">
              <Link href={`/terminal/pools/${encodeURIComponent(item.id)}`} className="qy-btn qy-btn-sm qy-btn-outline">
                View details
              </Link>
              <button type="button" className="qy-btn qy-btn-sm qy-btn-primary" onClick={() => onCreateAlert(item)} aria-label={`Set alert for ${item.platform} ${item.asset}`}>
                Set alert
              </button>
              <button type="button" className={`qy-btn qy-btn-sm ${watched.has(item.id) ? 'qy-btn-disabled' : 'qy-btn-watch'}`} onClick={() => onToggleWatch(item.id)} disabled={watched.has(item.id)}>
                {watched.has(item.id) ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="qy-mobile-results" aria-label="Pool results">
        {sorted.map((item) => (
          <article key={item.id} className="qy-pool-card">
            <div className="qy-pool-card-head">
              <div className="qy-asset-cell">
                <ProtocolLogo name={item.platform} logoUrl={item.logoUrl} />
                <div>
                  <h2>{item.platform}</h2>
                  <p>{item.asset} / {item.chain}</p>
                </div>
              </div>
              <GradeChip item={item} />
            </div>
            <div className="qy-pool-card-metrics">
              <div><span>APY</span><strong>{item.apy.toFixed(2)}%</strong></div>
              <div><span>24h</span><strong>{item.volatility.toFixed(2)}%</strong></div>
              <div><span>TVL</span><strong>{item.tvl}</strong></div>
              <div><span>Risk</span><strong>{item.risk}</strong></div>
              <div><span>Chain</span><strong>{item.chain}</strong></div>
              <div><span>Safety</span><strong>{item.confidence}</strong></div>
            </div>
            <p className="qy-rank-reason">{item.rankReason}</p>
            <div className="qy-terminal-actions">
              <Link href={`/terminal/pools/${encodeURIComponent(item.id)}`} className="qy-btn qy-btn-sm qy-btn-outline">View details</Link>
              <button type="button" className="qy-btn qy-btn-sm qy-btn-primary" onClick={() => onCreateAlert(item)} aria-label={`Set alert for ${item.platform} ${item.asset}`}>Set alert</button>
              <button type="button" className={`qy-btn qy-btn-sm ${watched.has(item.id) ? 'qy-btn-disabled' : 'qy-btn-watch'}`} onClick={() => onToggleWatch(item.id)} disabled={watched.has(item.id)}>
                {watched.has(item.id) ? 'Saved' : 'Save'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {data.hasMore ? (
        <div className="qy-load-more">
          <button type="button" className="qy-btn qy-btn-secondary" onClick={onLoadMore}>
            Load more pools
          </button>
        </div>
      ) : null}
    </section>
  )
}
