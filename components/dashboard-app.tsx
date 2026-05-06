'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition, useEffect } from 'react'
import {
  LineChart, Eye, Bell, Settings as SettingsIcon, LogOut, Search,
  Plus, Trash2, ExternalLink, BellOff, ShieldCheck, Filter, ArrowRight,
} from 'lucide-react'
import { categories, chains, riskLevels, timeCosts } from '../lib/constants'
import { money } from '../lib/scoring'
import type { DashboardData, Opportunity, AlertRule } from '../lib/types'

type Tab = 'opportunities' | 'watchlist' | 'alerts' | 'settings'

const navItems: { tab: Tab; label: string; Icon: typeof LineChart }[] = [
  { tab: 'opportunities', label: 'Opportunities', Icon: LineChart },
  { tab: 'watchlist', label: 'Watchlist', Icon: Eye },
  { tab: 'alerts', label: 'Alerts', Icon: Bell },
  { tab: 'settings', label: 'Settings', Icon: SettingsIcon },
]

type Toast = { id: number; type: 'success' | 'error'; msg: string }

function useToasts() {
  const [items, setItems] = useState<Toast[]>([])
  const push = (type: Toast['type'], msg: string) => {
    const id = Date.now() + Math.random()
    setItems((p) => [...p, { id, type, msg }])
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 3500)
  }
  return { items, push }
}

export function DashboardApp({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData)
  const [tab, setTab] = useState<Tab>('opportunities')
  const [, startTransition] = useTransition()
  const toasts = useToasts()

  // Filter / search state
  const [chain, setChain] = useState(initialData.settings.chain)
  const [risk, setRisk] = useState(initialData.settings.risk)
  const [time, setTime] = useState(initialData.settings.time)
  const [category, setCategory] = useState(initialData.settings.category)
  const [query, setQuery] = useState('')
  const [capital, setCapital] = useState(initialData.settings.capital)

  const watched = useMemo(() => new Set(data.watchlist), [data.watchlist])
  const watchedOps = useMemo(() => data.opportunities.filter((o) => watched.has(o.id)), [data.opportunities, watched])

  function refreshOpportunities(next = { chain, risk, time, category, q: query, capital }) {
    const params = new URLSearchParams({
      chain: next.chain, risk: next.risk, time: next.time,
      category: next.category, q: next.q, capital: String(next.capital),
    })
    startTransition(async () => {
      const r = await fetch(`/api/opportunities?${params}`)
      const result = await r.json()
      setData((c) => ({ ...c, ...result }))
    })
  }

  async function toggleWatch(id: string) {
    const isOn = watched.has(id)
    const r = isOn
      ? await fetch(`/api/watchlist/${encodeURIComponent(id)}`, { method: 'DELETE' })
      : await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunityId: id }),
        })
    const result = await r.json()
    if (r.ok) {
      setData((c) => ({ ...c, watchlist: result.items }))
      toasts.push('success', isOn ? 'Removed from watchlist' : 'Added to watchlist')
    } else {
      toasts.push('error', result?.error || 'Action failed')
    }
  }

  async function createAlert(item: Opportunity) {
    const r = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${item.asset} on ${item.chain} above ${Math.max(1, Math.floor(item.apy))}%`,
        chain: item.chain, category: item.category, asset: item.asset,
        minApy: Math.max(1, Math.floor(item.apy)), maxRisk: item.risk,
        minConfidence: Math.max(70, item.confidence - 5),
        frequency: 'daily', enabled: true,
      }),
    })
    const result = await r.json()
    if (r.ok) {
      setData((c) => ({ ...c, alerts: result.alerts }))
      toasts.push('success', "Alert created — we'll email you when thresholds match.")
      setTab('alerts')
    } else {
      toasts.push('error', result?.error || 'Failed to create alert')
    }
  }

  async function deleteAlert(id: string) {
    const r = await fetch(`/api/alerts/${encodeURIComponent(id)}`, { method: 'DELETE' })
    const result = await r.json()
    if (r.ok) {
      setData((c) => ({ ...c, alerts: result.alerts }))
      toasts.push('success', 'Alert removed')
    }
  }

  async function toggleAlert(alert: AlertRule) {
    const r = await fetch(`/api/alerts/${encodeURIComponent(alert.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !alert.enabled }),
    })
    const result = await r.json()
    if (r.ok) setData((c) => ({ ...c, alerts: result.alerts }))
  }

  async function saveSettings(patch: Partial<typeof data.settings>) {
    const next = { ...data.settings, ...patch }
    const r = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    const result = await r.json()
    if (r.ok) {
      setData((c) => ({ ...c, settings: result.settings }))
      toasts.push('success', 'Settings saved')
    }
  }

  return (
    <div className="qy-app">
      <aside className="qy-aside" data-testid="dash-sidebar">
        <div className="qy-aside-head">
          <Link href="/" className="qy-logo">
            <span className="qy-logo-mark"><span /><span /><span /></span>
            <span className="qy-logo-text">QuickYield</span>
          </Link>
        </div>
        <nav className="qy-aside-nav">
          {navItems.map(({ tab: t, label, Icon }) => (
            <button
              key={t}
              type="button"
              className={`qy-aside-link ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
              data-testid={`nav-${t}`}
            >
              <Icon className="qy-aside-icon" /> {label}
            </button>
          ))}
        </nav>
        <div className="qy-aside-foot">
          <div className="qy-aside-user">
            <div className="qy-aside-user-label">Mode</div>
            <div className="qy-aside-user-email">{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Authenticated' : 'Local beta'}</div>
          </div>
          <Link href="/" className="qy-aside-link" data-testid="logout-btn">
            <LogOut className="qy-aside-icon" /> Back to home
          </Link>
        </div>
      </aside>

      <div className="qy-main">
        <header className="qy-topbar">
          <div className="qy-topbar-status">
            <span className="qy-pill-dot" />
            <span className="qy-overline">
              {data.dataStatus === 'live' ? 'Live · DeFiLlama' : 'Curated fallback'}
            </span>
          </div>
          <div className="qy-topbar-mobile-tabs">
            {navItems.map(({ tab: t, label }) => (
              <button
                key={t}
                type="button"
                className={`qy-topbar-mobile-tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >{label.slice(0, 3)}</button>
            ))}
          </div>
        </header>

        <div
          key={tab}
          className="qy-fade-up"
          style={{ animationDuration: '0.35s' }}
        >
            {tab === 'opportunities' && (
              <OpportunitiesView
                data={data}
                chain={chain} setChain={(v: string) => { setChain(v); refreshOpportunities({ chain: v, risk, time, category, q: query, capital }) }}
                risk={risk} setRisk={(v: string) => { setRisk(v); refreshOpportunities({ chain, risk: v, time, category, q: query, capital }) }}
                time={time} setTime={(v: string) => { setTime(v); refreshOpportunities({ chain, risk, time: v, category, q: query, capital }) }}
                category={category} setCategory={(v: string) => { setCategory(v); refreshOpportunities({ chain, risk, time, category: v, q: query, capital }) }}
                query={query} setQuery={(v: string) => { setQuery(v); refreshOpportunities({ chain, risk, time, category, q: v, capital }) }}
                watched={watched}
                onToggleWatch={toggleWatch}
                onCreateAlert={createAlert}
              />
            )}
            {tab === 'watchlist' && (
              <WatchlistView items={watchedOps} onRemove={toggleWatch} onCreateAlert={createAlert} />
            )}
            {tab === 'alerts' && (
              <AlertsView alerts={data.alerts} onDelete={deleteAlert} onToggle={toggleAlert} />
            )}
            {tab === 'settings' && (
              <SettingsView
                settings={data.settings}
                capital={capital} setCapital={setCapital}
                onSave={saveSettings}
              />
            )}
          </div>
      </div>

      <div className="qy-toast-wrap" aria-live="polite">
        {toasts.items.map((t) => (
          <div key={t.id} className={`qy-toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Sub views ---------- */

function OpportunitiesView({
  data, chain, setChain, risk, setRisk, time, setTime, category, setCategory,
  query, setQuery, watched, onToggleWatch, onCreateAlert,
}: any) {
  const [sortBy, setSortBy] = useState<'apy' | 'tvl'>('apy')
  const sorted = useMemo(() => {
    const arr = [...data.opportunities]
    arr.sort((a: Opportunity, b: Opportunity) =>
      sortBy === 'apy' ? (b.apy - a.apy) : (b.tvlUsd - a.tvlUsd)
    )
    return arr
  }, [data.opportunities, sortBy])

  const safeOnly = risk === 'Low'
  const totalTvl = data.opportunities.reduce((s: number, o: Opportunity) => s + (o.tvlUsd || 0), 0)
  const avgApy = data.opportunities.length ? (data.opportunities.reduce((s: number, o: Opportunity) => s + o.apy, 0) / data.opportunities.length) : 0

  return (
    <div className="qy-page" data-testid="opportunities-page">
      <div className="qy-page-header">
        <span className="qy-overline qy-overline-signal">Live scanner</span>
        <h1>Opportunities</h1>
        <p>{data.opportunities.length} matches · {money(totalTvl)} TVL · avg APY {avgApy.toFixed(1)}%</p>
      </div>

      <div className="qy-filters" data-testid="filters">
        <div className="qy-filter-label"><Filter size={14} /><span className="qy-overline">Filter</span></div>
        <select className="qy-input" value={chain} onChange={(e) => setChain(e.target.value)} data-testid="filter-chain">
          {chains.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          className="qy-input"
          placeholder="Search asset, protocol..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="filter-search"
        />
        <select className="qy-input" value={category} onChange={(e) => setCategory(e.target.value)} data-testid="filter-category">
          {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          className={`qy-chip ${safeOnly ? 'active' : ''}`}
          onClick={() => setRisk(safeOnly ? 'All risk' : 'Low')}
          data-testid="filter-safe"
        >
          <ShieldCheck size={12} /> Beginner safe
        </button>
        <select className="qy-input" value={time} onChange={(e) => setTime(e.target.value)} data-testid="filter-time">
          {timeCosts.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="qy-sort">
          <span className="qy-overline">Sort</span>
          <button className={`qy-sort-btn ${sortBy === 'apy' ? 'active' : ''}`} onClick={() => setSortBy('apy')} data-testid="sort-apy">APY</button>
          <button className={`qy-sort-btn ${sortBy === 'tvl' ? 'active' : ''}`} onClick={() => setSortBy('tvl')} data-testid="sort-tvl">TVL</button>
        </div>
      </div>

      <div className="qy-table-wrap">
        <div className="qy-table-head">
          <span>Protocol · Asset</span>
          <span>Chain</span>
          <span>Risk</span>
          <span style={{ textAlign: 'right' }}>TVL</span>
          <span style={{ textAlign: 'right' }}>APY</span>
          <span style={{ textAlign: 'right' }}>Action</span>
        </div>
        {sorted.length === 0 ? (
          <div className="qy-table-empty">No opportunities match these filters.</div>
        ) : sorted.map((o: Opportunity, i: number) => (
          <div
            key={o.id}
            className="qy-table-row qy-row-slide"
            style={{ animationDelay: `${Math.min(i * 0.015, 0.4)}s` }}
            data-testid="opp-row"
          >
            <div className="qy-asset-cell">
              <div className="qy-asset-icon">{(o.platform || '?').slice(0, 1).toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div className="qy-asset-name">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.platform}</span>
                  {o.risk === 'Low' && <span className="qy-tag-mini qy-risk-low">Safe</span>}
                </div>
                <div className="qy-asset-meta">{o.asset}</div>
              </div>
            </div>
            <span className="qy-mono" style={{ fontSize: 12, color: 'var(--ink-dim)' }}>{o.chain}</span>
            <span><span className={`qy-tag-mini qy-risk-${o.risk.toLowerCase()}`}>{o.risk}</span></span>
            <span className="qy-num">{o.tvl}</span>
            <span className="qy-num bold">{o.apy ? `${o.apy.toFixed(2)}%` : 'Task'}</span>
            <div className="qy-actions">
              {o.actionUrl && (
                <a href={o.actionUrl} target="_blank" rel="noreferrer" className="qy-icon-btn" title="Open source">
                  <ExternalLink size={14} />
                </a>
              )}
              <button
                className="qy-icon-btn"
                onClick={() => onToggleWatch(o.id)}
                disabled={watched.has(o.id)}
                title={watched.has(o.id) ? 'Already in watchlist' : 'Add to watchlist'}
                data-testid="opp-add-watch"
              ><Plus size={14} /></button>
              <button className="qy-icon-btn" onClick={() => onCreateAlert(o)} title="Create alert">
                <Bell size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WatchlistView({ items, onRemove, onCreateAlert }: { items: Opportunity[]; onRemove: (id: string) => void; onCreateAlert: (o: Opportunity) => void }) {
  return (
    <div className="qy-page" data-testid="watchlist-page">
      <div className="qy-page-header">
        <span className="qy-overline qy-overline-signal">Saved</span>
        <h1>Watchlist</h1>
        <p>Pools you're tracking. Tap the bell to set thresholds.</p>
      </div>
      {items.length === 0 ? (
        <div className="qy-empty" data-testid="watchlist-empty">
          <Eye className="qy-empty-icon" />
          <h3>No pools saved yet</h3>
          <p>Browse Opportunities and click the + icon to start tracking yields here.</p>
        </div>
      ) : (
        <div>
          {items.map((o, i) => (
            <div key={o.id} style={{ animationDelay: `${i * 0.04}s` }} className="qy-wl-row qy-row-slide" data-testid="watchlist-row">
              <div className="qy-wl-row-inner">
                <div className="qy-asset-icon">{(o.platform || '?').slice(0, 1).toUpperCase()}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="qy-asset-name">{o.platform}</div>
                  <div className="qy-asset-meta">{o.chain} · {o.asset}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="qy-overline">APY</div>
                  <div className="qy-num bold">{o.apy.toFixed(2)}%</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="qy-overline">TVL</div>
                  <div className="qy-num">{o.tvl}</div>
                </div>
                <div className="qy-wl-actions">
                  {o.actionUrl && (<a href={o.actionUrl} target="_blank" rel="noreferrer" className="qy-icon-btn"><ExternalLink size={14} /></a>)}
                  <button className="qy-icon-btn" onClick={() => onCreateAlert(o)} title="Create alert" data-testid="wl-create-alert-btn"><Bell size={14} /></button>
                  <button className="qy-icon-btn danger" onClick={() => onRemove(o.id)} data-testid="wl-remove-btn"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AlertsView({ alerts, onDelete, onToggle }: { alerts: AlertRule[]; onDelete: (id: string) => void; onToggle: (a: AlertRule) => void }) {
  return (
    <div className="qy-page" data-testid="alerts-page">
      <div className="qy-page-header">
        <span className="qy-overline qy-overline-signal">Notifications</span>
        <h1>Alerts</h1>
        <p>Threshold rules across your watchlist. Email lands the second a threshold is crossed.</p>
      </div>
      {alerts.length === 0 ? (
        <div className="qy-empty" data-testid="alerts-empty">
          <Bell className="qy-empty-icon" />
          <h3>No alerts yet</h3>
          <p>Open Opportunities or Watchlist and tap the bell icon on a pool to set a threshold.</p>
        </div>
      ) : (
        <div className="qy-table-wrap">
          <div className="qy-table-head" style={{ gridTemplateColumns: '4fr 2fr 2fr 2fr 1fr' }}>
            <span>Rule</span><span>Asset</span><span>Min APY</span><span>Frequency</span><span style={{ textAlign: 'right' }}>Actions</span>
          </div>
          {alerts.map((a, i) => (
            <div
              key={a.id}
              className="qy-table-row qy-row-slide"
              style={{ gridTemplateColumns: '4fr 2fr 2fr 2fr 1fr', opacity: a.enabled ? 1 : 0.5, animationDelay: `${i * 0.04}s` }}
              data-testid="alert-row"
            >
              <div>
                <div style={{ color: 'var(--ink)', fontSize: 14 }}>{a.name}</div>
                <div className="qy-asset-meta">{a.chain} · {a.category}</div>
              </div>
              <span className="qy-mono" style={{ fontSize: 12, color: 'var(--ink-dim)' }}>{a.asset}</span>
              <span className="qy-num bold" style={{ color: 'var(--safe)' }}>{a.minApy}%</span>
              <span className="qy-mono" style={{ fontSize: 12, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.frequency}</span>
              <div className="qy-actions">
                <button className="qy-icon-btn" onClick={() => onToggle(a)} data-testid="alert-toggle">
                  {a.enabled ? <Bell size={14} /> : <BellOff size={14} />}
                </button>
                <button className="qy-icon-btn danger" onClick={() => onDelete(a.id)} data-testid="alert-delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingsView({ settings, capital, setCapital, onSave }: any) {
  const [emailOpt, setEmailOpt] = useState(settings.emailOptIn)
  const [freq, setFreq] = useState<'instant' | 'daily' | 'weekly'>('daily')

  // Keep capital in form state synced when user types
  useEffect(() => { setCapital(settings.capital) }, [settings.capital, setCapital])

  return (
    <div className="qy-page" data-testid="settings-page">
      <div className="qy-page-header">
        <span className="qy-overline qy-overline-signal">Account</span>
        <h1>Settings</h1>
      </div>

      <div style={{ maxWidth: 720 }}>
        <section className="qy-set-section">
          <h3>Profile</h3>
          <p>Defaults are saved server-side for authenticated users and in-memory for local development.</p>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Tracked capital</strong>
              <span>Used to estimate weekly earnings for each opportunity.</span>
            </div>
            <input
              className="qy-input"
              style={{ width: 120, fontFamily: 'var(--font-mono)' }}
              type="number"
              min={25}
              max={100000}
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              onBlur={() => onSave({ capital })}
              data-testid="settings-capital"
            />
          </div>
        </section>

        <section className="qy-set-section">
          <h3>Notifications</h3>
          <p>Email frequency for alert deliveries.</p>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Email alerts enabled</strong>
              <span>Master switch for all alerts.</span>
            </div>
            <button
              type="button"
              className={`qy-toggle ${emailOpt ? 'on' : ''}`}
              onClick={() => { const next = !emailOpt; setEmailOpt(next); onSave({ emailOptIn: next }) }}
              data-testid="toggle-notifications"
              aria-label="Toggle notifications"
            />
          </div>
          <div style={{ paddingTop: 16 }}>
            <div className="qy-overline" style={{ marginBottom: 8 }}>Digest frequency</div>
            <div className="qy-freq-group">
              {(['instant', 'daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`qy-chip ${freq === f ? 'active-signal' : ''}`}
                  onClick={() => setFreq(f)}
                  data-testid={`freq-${f}`}
                >{f}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="qy-set-section">
          <h3>Disclaimers</h3>
          <p>QuickYield is informational research and alerting. We never custody funds, never connect to your wallet, and never execute trades. APY data is sourced from DeFiLlama and refreshed hourly. Always verify on the source protocol before depositing.</p>
        </section>
      </div>
    </div>
  )
}
