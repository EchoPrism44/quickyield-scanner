'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowUpRight, Bell, Bookmark, Filter, Search, SlidersHorizontal } from 'lucide-react'
import { categories, chains, timeCosts } from '../../lib/constants'
import { ProtocolLogo } from '../protocol-logo'
import { GradeChip, SparklineCell } from './shared'
import { MarketPulse } from './market-pulse'
import type { DashboardData, Opportunity, OpportunityPreset } from '../../lib/types'

const presetItems: { key: OpportunityPreset | 'all'; label: string }[] = [
  { key: 'all', label: 'All pools' },
  { key: 'safe-stablecoins', label: 'Safer stablecoins' },
  { key: 'eth-staking', label: 'ETH staking' },
  { key: 'solana-yield', label: 'Solana yield' },
  { key: 'rwa', label: 'RWA / T-bills' },
  { key: 'high-apy', label: 'High APY' },
  { key: 'saved', label: 'Saved' },
]

/**
 * Mirrors STABLE_ASSETS in lib/opportunities.ts. Duplicated rather than
 * imported because that module is server-only — importing from it would drag
 * the scanner and store into the client bundle.
 */
const STABLE_ASSETS = new Set(['USDC', 'USDT', 'DAI', 'USDS', 'USDE', 'FRAX', 'LUSD', 'PYUSD'])

/** Signed APY change, colored like CMC (green up / red down). */
function Delta({ value }: { value?: number }) {
  if (value === undefined || Number.isNaN(value)) return <span className="qy-terminal-submetric">—</span>
  const cls = value > 0.01 ? 'qy-wl-up' : value < -0.01 ? 'qy-wl-down' : 'qy-wl-flat'
  return <strong className={cls}>{value > 0 ? '+' : ''}{value.toFixed(2)}%</strong>
}

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
  const [sortBy, setSortBy] = useState<'confidence' | 'apy' | 'tvl' | 'change1d' | 'change7d' | 'change30d' | 'updated'>('confidence')
  const [heatmapMetric, setHeatmapMetric] = useState<'apy' | 'safety'>('apy')

  const sorted = useMemo(() => {
    const items = [...data.opportunities]
    items.sort((a, b) => {
      if (sortBy === 'apy') return b.apy - a.apy
      if (sortBy === 'tvl') return b.tvlUsd - a.tvlUsd
      if (sortBy === 'change1d') return (b.apyPct1D ?? -Infinity) - (a.apyPct1D ?? -Infinity)
      if (sortBy === 'change7d') return (b.apyPct7D ?? -Infinity) - (a.apyPct7D ?? -Infinity)
      if (sortBy === 'change30d') return (b.apyPct30D ?? -Infinity) - (a.apyPct30D ?? -Infinity)
      if (sortBy === 'updated') return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      return b.confidence - a.confidence
    })
    return items
  }, [data.opportunities, sortBy])

  // Headline figures come from the server, computed across every pool matching
  // the current filters. Deriving them from data.opportunities would describe
  // only the page that happens to be loaded.
  const { avgApy, totalTvlUsd, saferCount, bestStablecoinApy, highestApy, apyBands } = data.stats
  // These two name a specific pool, so they can only come from loaded rows —
  // the wording below says "loaded" rather than implying a market-wide best.
  const stablecoinBestLoaded = data.opportunities
    .filter((item) => item.category.toLowerCase().includes('stable') || STABLE_ASSETS.has(item.asset.toUpperCase()))
    .sort((a, b) => b.apy - a.apy)[0]
  const highestApyLoaded = [...data.opportunities].sort((a, b) => b.apy - a.apy)[0]
  const fmtTvl = (v: number) => (v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(0)}M` : `$${Math.round(v)}`)
  const lastScan = new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const sortArrow = (key: typeof sortBy) => (sortBy === key ? ' ▾' : '')
  const scannerUpdates = [
    stablecoinBestLoaded ? `Stablecoin leader in view: ${stablecoinBestLoaded.asset} on ${stablecoinBestLoaded.platform} at ${stablecoinBestLoaded.apy.toFixed(2)}% APY` : 'Stablecoin leader will appear after the next scan.',
    highestApyLoaded ? `Highest APY in view: ${highestApyLoaded.asset} on ${highestApyLoaded.chain} at ${highestApyLoaded.apy.toFixed(2)}%` : 'Highest APY will appear after the next scan.',
    `${saferCount} lower-risk pools match the current view.`,
    data.fallbackReason ? `Fallback feed active: ${data.fallbackReason}` : `Live scanner refreshed at ${lastScan}.`,
  ]

  return (
    <section className="qy-page qy-terminal-page" data-testid="discover-page">
      <MarketPulse delta={data.weekDelta} />

      <div className="qy-page-header qy-terminal-header">
        <div>
          <span className="qy-overline qy-overline-signal">Yield radar</span>
          <h1>Discover</h1>
          <p>Scan live pools, understand why they rank, save candidates, and set target alerts.</p>
        </div>
        <div className="qy-terminal-kpis">
          <div className="qy-terminal-kpi"><span className="qy-overline">Best stablecoin yield</span><strong>{bestStablecoinApy !== null ? `${bestStablecoinApy.toFixed(2)}%` : '--'}</strong></div>
          <div className="qy-terminal-kpi"><span className="qy-overline">Highest APY</span><strong>{highestApy !== null ? `${highestApy.toFixed(2)}%` : '--'}</strong></div>
          <div className="qy-terminal-kpi">
            <span className="qy-overline">Pools scanned</span>
            <strong>{data.total}</strong>
            {data.weekDelta ? (
              <span className={`qy-kpi-delta ${data.weekDelta.poolsDelta >= 0 ? 'qy-wl-up' : 'qy-wl-down'}`}>
                {data.weekDelta.poolsDelta >= 0 ? '+' : ''}{data.weekDelta.poolsDelta} this week
              </span>
            ) : null}
          </div>
          <div className="qy-terminal-kpi"><span className="qy-overline">Triggered alerts</span><strong>{triggeredAlerts}</strong></div>
        </div>
      </div>

      <div className="qy-discover-layout">
      <div className="qy-discover-main">
      <div className="qy-discover-summary" aria-label="Current scan summary">
        <div><span className="qy-overline">Avg APY</span><strong>{avgApy.toFixed(2)}%</strong></div>
        <div><span className="qy-overline">Total TVL tracked</span><strong>{fmtTvl(totalTvlUsd)}</strong></div>
        <div><span className="qy-overline">Matched safer pools</span><strong>{saferCount}</strong></div>
        <div><span className="qy-overline">Loaded now</span><strong>{data.opportunities.length} of {data.total}</strong></div>
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

      <div className="qy-chain-chips" aria-label="Filter by chain">
        {chains.map((item) => (
          <button
            key={item}
            type="button"
            className={`qy-chip ${chain === item ? 'active-signal' : ''}`}
            onClick={() => onChain(item)}
            aria-pressed={chain === item}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="qy-filters qy-terminal-filters" data-testid="filters">
        <label className="qy-search-field">
          <span><Search size={14} /> Search</span>
          <input className="qy-input qy-market-search" placeholder="Pool, asset, protocol" value={query} onChange={(event) => onQuery(event.target.value)} />
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

      <div className="qy-terminal-table-wrap">
        <div className="qy-terminal-table-head">
          <span>Protocol</span>
          <span>Asset</span>
          <button type="button" className={`qy-sort-link ${sortBy === 'apy' ? 'active' : ''}`} onClick={() => setSortBy('apy')}>APY{sortArrow('apy')}</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'change1d' ? 'active' : ''}`} onClick={() => setSortBy('change1d')}>24h{sortArrow('change1d')}</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'change7d' ? 'active' : ''}`} onClick={() => setSortBy('change7d')}>7d{sortArrow('change7d')}</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'change30d' ? 'active' : ''}`} onClick={() => setSortBy('change30d')}>30d{sortArrow('change30d')}</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'tvl' ? 'active' : ''}`} onClick={() => setSortBy('tvl')}>TVL{sortArrow('tvl')}</button>
          <span>Grade</span>
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
              <span className="qy-terminal-submetric">{item.chain}</span>
            </div>
            {/* The column header is hidden below 720px, where each row becomes
                a card, so these two cells carry their own label there. Both are
                display:none on desktop, where the header names them. */}
            <div className="qy-terminal-metric">
              <span className="qy-terminal-submetric qy-label-mobile">APY</span>
              <strong>{item.apy.toFixed(2)}%</strong>
              <SparklineCell poolId={item.id} />
            </div>
            <div className="qy-terminal-metric">
              <Delta value={item.apyPct1D} />
              <span className="qy-terminal-submetric">24h</span>
            </div>
            <div className="qy-terminal-metric">
              <Delta value={item.apyPct7D} />
              <span className="qy-terminal-submetric">7d</span>
            </div>
            <div className="qy-terminal-metric">
              <Delta value={item.apyPct30D} />
              <span className="qy-terminal-submetric">30d</span>
            </div>
            <div className="qy-terminal-metric qy-terminal-right">
              <span className="qy-terminal-submetric qy-label-mobile">TVL</span>
              <strong>{item.tvl}</strong>
            </div>
            <div className="qy-terminal-metric">
              <GradeChip item={item} />
              <span className="qy-terminal-submetric">{item.risk === 'Low' ? 'Lower risk' : 'Review carefully'}</span>
            </div>
            {/* Icon actions on the desktop row: three text buttons cost ~230px
                per row, which is what pushed Grade and Actions off screen. The
                mobile cards below keep the labelled buttons. */}
            <div className="qy-terminal-actions">
              <button
                type="button"
                className={`qy-icon-action ${watched.has(item.id) ? 'is-on' : ''}`}
                onClick={() => onToggleWatch(item.id)}
                disabled={watched.has(item.id)}
                title={watched.has(item.id) ? 'Saved to watchlist' : 'Save to watchlist'}
                aria-label={watched.has(item.id) ? `${item.platform} ${item.asset} saved to watchlist` : `Save ${item.platform} ${item.asset} to watchlist`}
              >
                <Bookmark size={15} />
              </button>
              <button
                type="button"
                className="qy-icon-action"
                onClick={() => onCreateAlert(item)}
                title="Set alert"
                aria-label={`Set alert for ${item.platform} ${item.asset}`}
              >
                <Bell size={15} />
              </button>
              <Link
                href={`/terminal/pools/${encodeURIComponent(item.id)}`}
                className="qy-icon-action"
                title="View details"
                aria-label={`View details for ${item.platform} ${item.asset}`}
              >
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {data.hasMore ? (
        <div className="qy-load-more">
          <button type="button" className="qy-btn qy-btn-secondary" onClick={onLoadMore}>
            Load more pools
          </button>
        </div>
      ) : null}
      </div>

      {/* Right rail on desktop (≥1100px); stacks below the table on mobile */}
      <aside className="qy-discover-rail">
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
            {apyBands.map(({ band, count, lowRisk, avgSafety }, index) => (
              <div key={band} className={`qy-market-map-cell heat-${index}`}>
                <span className="qy-overline">{band} APY</span>
                <strong>{heatmapMetric === 'apy' ? count : avgSafety || '--'}</strong>
                <small>{heatmapMetric === 'apy' ? `${lowRisk} lower risk` : `${count} pools`}</small>
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
      </aside>
      </div>
    </section>
  )
}
