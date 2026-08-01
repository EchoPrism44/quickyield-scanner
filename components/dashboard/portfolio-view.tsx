'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Briefcase, Plus, Radar, Trash2, X } from 'lucide-react'
import { ProtocolLogo } from '../protocol-logo'
import { GradeBadge } from './shared'
import { summarizePortfolio } from '../../lib/portfolio'
import type { Opportunity, PositionView } from '../../lib/types'

function usd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function Delta({ value }: { value: number }) {
  const cls = value > 0.01 ? 'qy-wl-up' : value < -0.01 ? 'qy-wl-down' : 'qy-wl-flat'
  const sign = value > 0 ? '+' : ''
  return <span className={cls}>{sign}{value.toFixed(2)}%</span>
}

export function PortfolioView({
  onGoDiscover,
  pushToast,
}: {
  onGoDiscover: () => void
  pushToast: (type: 'success' | 'error', msg: string) => void
}) {
  const [positions, setPositions] = useState<PositionView[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [savedPools, setSavedPools] = useState<Opportunity[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [amount, setAmount] = useState(1000)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    fetch('/api/positions')
      .then((r) => r.json())
      .then((d: { positions?: PositionView[] }) => setPositions(d.positions ?? []))
      .catch(() => setPositions([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const summary = useMemo(() => summarizePortfolio(positions), [positions])

  function openDialog() {
    setDialogOpen(true)
    fetch('/api/opportunities?preset=saved&pageSize=100&capital=100000')
      .then((r) => r.json())
      .then((d: { opportunities?: Opportunity[] }) => {
        const pools = d.opportunities ?? []
        setSavedPools(pools)
        setSelectedId((current) => current || pools[0]?.id || '')
      })
      .catch(() => setSavedPools([]))
  }

  async function submit() {
    if (!selectedId || amount <= 0) return
    setSaving(true)
    try {
      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: selectedId, amountUsd: amount }),
      })
      const result = await response.json()
      if (response.ok) {
        setPositions(result.positions ?? [])
        setDialogOpen(false)
        pushToast('success', 'Position added')
      } else {
        pushToast('error', result?.error || 'Could not add position')
      }
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    const response = await fetch(`/api/positions/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (response.ok) {
      pushToast('success', 'Position removed')
      load()
    } else {
      pushToast('error', 'Could not remove position')
    }
  }

  return (
    <section className="qy-page" data-testid="portfolio-page">
      <div className="qy-page-header qy-page-header-row">
        <div>
          <span className="qy-overline qy-overline-signal">Positions</span>
          <h1>Portfolio</h1>
          <p>Track what you&apos;re actually deployed in — blended yield and Safety Grades, no wallet, no custody.</p>
        </div>
        <button type="button" className="qy-btn qy-btn-primary" onClick={openDialog}>
          <Plus size={14} /> Add position
        </button>
      </div>

      {positions.length > 0 ? (
        <div className="qy-discover-summary" aria-label="Portfolio summary">
          <div><span className="qy-overline">Tracked capital</span><strong>{usd(summary.totalUsd)}</strong></div>
          <div><span className="qy-overline">Blended APY</span><strong>{summary.blendedApy.toFixed(2)}%</strong></div>
          <div><span className="qy-overline">Projected / yr</span><strong>{usd(summary.projectedAnnualUsd)}</strong></div>
          <div><span className="qy-overline">Positions</span><strong>{summary.positionCount}</strong></div>
        </div>
      ) : null}

      {loading ? (
        <div className="qy-watchlist-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="qy-watchlist-card">
              <div className="qy-skeleton" style={{ height: 36, width: '60%', marginBottom: 16 }} />
              <div className="qy-skeleton" style={{ height: 56, width: '100%' }} />
            </div>
          ))}
        </div>
      ) : positions.length === 0 ? (
        <div className="qy-empty">
          <Briefcase className="qy-empty-icon" />
          <h3>No positions tracked yet</h3>
          <p>Add a position to see your blended APY and projected yield. It&apos;s manual and read-only — Litmus never touches your funds or wallet.</p>
          <button type="button" className="qy-btn qy-btn-primary qy-empty-action" onClick={openDialog}>
            <Plus size={14} /> Add your first position
          </button>
        </div>
      ) : (
        <div className="qy-watchlist-grid">
          {positions.map((p) => {
            const apy = p.current?.apy ?? p.entryApy
            const sinceEntry = apy - p.entryApy
            const projected = p.amountUsd * (apy / 100)
            return (
              <article key={p.id} className="qy-watchlist-card">
                <div className="qy-watchlist-card-top">
                  <div className="qy-asset-cell">
                    <ProtocolLogo name={p.platform} logoUrl={p.current?.logoUrl} />
                    <div>
                      <div className="qy-asset-name">{p.platform}</div>
                      <div className="qy-asset-meta">{p.asset} / {p.chain}</div>
                    </div>
                  </div>
                  {p.current ? <GradeBadge grade={p.current.safety} showLabel={false} /> : null}
                </div>

                <div className="qy-watchlist-metrics">
                  <div><span>Amount</span><strong>{usd(p.amountUsd)}</strong></div>
                  <div><span>Current APY</span><strong>{apy.toFixed(2)}%</strong></div>
                  <div><span>Proj / yr</span><strong>{usd(projected)}</strong></div>
                  <div><span>Since entry</span><strong><Delta value={sinceEntry} /></strong></div>
                </div>

                {!p.current ? <p className="qy-asset-meta" style={{ marginBottom: 12 }}>Pool not in the current scan — showing entry APY.</p> : null}

                <div className="qy-terminal-actions">
                  <button type="button" className="qy-btn qy-btn-sm qy-btn-outline" onClick={() => remove(p.id)} aria-label={`Remove ${p.platform} position`}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {dialogOpen ? (
        <div className="qy-modal-overlay" role="presentation" onClick={() => setDialogOpen(false)}>
          <div className="qy-modal qy-alert-dialog" role="dialog" aria-modal="true" aria-label="Add position" onClick={(e) => e.stopPropagation()}>
            <div className="qy-modal-header">
              <div>
                <span className="qy-overline qy-overline-signal">Track a position</span>
                <h2>Add position</h2>
              </div>
              <button type="button" className="qy-icon-btn" onClick={() => setDialogOpen(false)} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="qy-modal-body qy-alert-dialog-body">
              {savedPools.length === 0 ? (
                <div className="qy-empty" style={{ padding: '32px 16px' }}>
                  <h3>Save a pool first</h3>
                  <p>Add pools to your Watchlist from Discover, then track a position in them here.</p>
                  <button type="button" className="qy-btn qy-btn-secondary qy-empty-action" onClick={() => { setDialogOpen(false); onGoDiscover() }}>
                    <Radar size={14} /> Go to Discover
                  </button>
                </div>
              ) : (
                <>
                  <p className="qy-alert-preview">Tracking is manual and informational. Litmus never connects a wallet or moves funds.</p>
                  <label>
                    <span>Pool (from your watchlist)</span>
                    <select className="qy-input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                      {savedPools.map((pool) => (
                        <option key={pool.id} value={pool.id}>{pool.platform} · {pool.asset} / {pool.chain} ({pool.apy.toFixed(2)}%)</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Amount (USD)</span>
                    <input className="qy-input" type="number" min={1} step={50} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                    <small>How much capital you have in this pool — used for blended APY and projected yield.</small>
                  </label>
                </>
              )}
            </div>
            <div className="qy-modal-footer">
              <button type="button" className="qy-btn qy-btn-secondary" onClick={() => setDialogOpen(false)}>Cancel</button>
              <button type="button" className="qy-btn qy-btn-primary" onClick={submit} disabled={saving || savedPools.length === 0 || !selectedId}>
                <Plus size={14} /> {saving ? 'Adding…' : 'Add position'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
