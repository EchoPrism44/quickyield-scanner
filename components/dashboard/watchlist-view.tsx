'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bookmark, Radar, Target, Trash2 } from 'lucide-react'
import { ProtocolLogo } from '../protocol-logo'
import { GradeChip } from './shared'
import type { Opportunity } from '../../lib/types'

function Delta({ value, suffix = '%' }: { value: number | undefined; suffix?: string }) {
  if (value === undefined || Number.isNaN(value)) return <strong className="qy-wl-flat">--</strong>
  const cls = value > 0.01 ? 'qy-wl-up' : value < -0.01 ? 'qy-wl-down' : 'qy-wl-flat'
  const sign = value > 0 ? '+' : ''
  return <strong className={cls}>{sign}{value.toFixed(2)}{suffix}</strong>
}

function moveDirection(item: Opportunity): number {
  if (item.apyPct1D !== undefined) return item.apyPct1D
  if (item.trend === 'down') return -item.volatility
  if (item.trend === 'up') return item.volatility
  return 0
}

export function WatchlistView({
  watched,
  onToggleWatch,
  onCreateAlert,
  onGoDiscover,
}: {
  watched: Set<string>
  onToggleWatch: (id: string) => Promise<void>
  onCreateAlert: (item: Opportunity) => void
  onGoDiscover: () => void
}) {
  const [items, setItems] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const key = useMemo(() => [...watched].sort().join(','), [watched])

  useEffect(() => {
    if (watched.size === 0) return
    let cancelled = false
    fetch('/api/opportunities?preset=saved&pageSize=100&capital=100000')
      .then((r) => r.json())
      .then((d: { opportunities?: Opportunity[] }) => { if (!cancelled) setItems(d.opportunities ?? []) })
      .catch(() => { if (!cancelled) setItems([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [key, watched.size])

  const avgApy = items.length ? items.reduce((s, i) => s + i.apy, 0) / items.length : 0

  return (
    <section className="qy-page" data-testid="watchlist-page">
      <div className="qy-page-header qy-page-header-row">
        <div>
          <span className="qy-overline qy-overline-signal">Saved pools</span>
          <h1>Watchlist</h1>
          <p>The pools you&apos;re tracking, with current APY, Safety Grade, and how they&apos;ve moved.</p>
        </div>
        {items.length > 0 ? (
          <div className="qy-terminal-kpis">
            <div className="qy-terminal-kpi"><span className="qy-overline">Tracked</span><strong>{watched.size}</strong></div>
            <div className="qy-terminal-kpi"><span className="qy-overline">Avg APY</span><strong>{avgApy.toFixed(2)}%</strong></div>
          </div>
        ) : null}
      </div>

      {watched.size === 0 ? (
        <div className="qy-empty">
          <Bookmark className="qy-empty-icon" />
          <h3>Your watchlist is empty</h3>
          <p>Save pools from Discover to track their APY, Safety Grade, and movement here — then set an alert when one drifts.</p>
          <button type="button" className="qy-btn qy-btn-primary qy-empty-action" onClick={onGoDiscover}>
            <Radar size={14} />
            Browse pools
          </button>
        </div>
      ) : loading ? (
        <div className="qy-watchlist-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="qy-watchlist-card">
              <div className="qy-skeleton" style={{ height: 36, width: '60%', marginBottom: 16 }} />
              <div className="qy-skeleton" style={{ height: 56, width: '100%' }} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="qy-empty">
          <Bookmark className="qy-empty-icon" />
          <h3>Saved pools aren&apos;t in the current scan</h3>
          <p>Your saved pools will reappear here after the next market scan refreshes.</p>
        </div>
      ) : (
        <div className="qy-watchlist-grid">
          {items.map((item) => {
            const move = moveDirection(item)
            const vs30d = item.apyMean30d === undefined ? undefined : item.apy - item.apyMean30d
            return (
              <article key={item.id} className="qy-watchlist-card">
                <div className="qy-watchlist-card-top">
                  <div className="qy-asset-cell">
                    <ProtocolLogo name={item.platform} logoUrl={item.logoUrl} />
                    <div>
                      <div className="qy-asset-name">{item.platform}</div>
                      <div className="qy-asset-meta">{item.asset} / {item.chain}</div>
                    </div>
                  </div>
                  <GradeChip item={item} showLabel={false} />
                </div>

                <div className="qy-watchlist-metrics">
                  <div><span>APY</span><strong>{item.apy.toFixed(2)}%</strong></div>
                  <div><span>24h move</span><Delta value={move} /></div>
                  <div><span>TVL</span><strong>{item.tvl}</strong></div>
                  <div><span>vs 30d avg</span><Delta value={vs30d} /></div>
                </div>

                <div className="qy-terminal-actions">
                  <Link href={`/terminal/pools/${encodeURIComponent(item.id)}`} className="qy-btn qy-btn-sm qy-btn-outline">View details</Link>
                  <button type="button" className="qy-btn qy-btn-sm qy-btn-primary" onClick={() => onCreateAlert(item)} aria-label={`Set alert for ${item.platform} ${item.asset}`}>
                    <Target size={13} /> Alert
                  </button>
                  <button type="button" className="qy-btn qy-btn-sm qy-btn-outline" onClick={() => onToggleWatch(item.id)} aria-label={`Remove ${item.platform} from watchlist`}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
