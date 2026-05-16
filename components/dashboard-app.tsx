'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useMemo, useState, useTransition, useEffect } from 'react'
import {
  LineChart, Eye, Bell, Settings as SettingsIcon,
  Trash2, ExternalLink, BellOff, ShieldCheck, Filter, BarChart3,
} from 'lucide-react'
import { categories, chains, timeCosts } from '../lib/constants'
import { formatTvl } from '../lib/scoring'
import { fetchSparkline, renderSparklineSvg } from '../lib/chart'
import { Onboarding } from './onboarding'
import type { DashboardData, Opportunity, AlertRule, UserSettings, DashboardUser, NotificationStatus } from '../lib/types'

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
  const [showOnboarding, setShowOnboarding] = useState(() => typeof window !== 'undefined' && !localStorage.getItem('qy_onboarded'))

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
      setData((c) => ({ ...c, settings: result.settings, notifications: result.notifications ?? c.notifications }))
      toasts.push('success', 'Settings saved')
    }
  }

  async function toggleNotificationChannel(type: 'email' | 'telegram', enabled: boolean) {
    const r = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationChannels: { [type]: enabled } }),
    })
    const result = await r.json()
    if (r.ok) {
      setData((c) => ({ ...c, notifications: result.notifications ?? c.notifications }))
      toasts.push('success', `${type === 'telegram' ? 'Telegram' : 'Email'} alerts ${enabled ? 'enabled' : 'paused'}`)
    } else {
      toasts.push('error', result?.error || 'Notification update failed')
    }
  }

  async function connectTelegram() {
    const r = await fetch('/api/notifications/telegram/connect', { method: 'POST' })
    const result = await r.json()
    if (!r.ok) {
      toasts.push('error', result?.error || 'Telegram connect failed')
      return
    }
    window.open(result.deepLink, '_blank', 'noopener,noreferrer')
    toasts.push('success', 'Telegram opened. Press Start in the bot to finish connecting.')
  }

  return (
    <div className="qy-app">
      {showOnboarding && <Onboarding onComplete={() => { localStorage.setItem('qy_onboarded', '1'); setShowOnboarding(false) }} />}
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
          <Link href="/analytics" className="qy-aside-link" target="_blank">
            <BarChart3 className="qy-aside-icon" /> Analytics
          </Link>
        </nav>
        <div className="qy-aside-foot">
          <div className="qy-aside-user">
            <div className="qy-aside-user-label">{data.user.isLocal ? 'Local mode' : data.user.name}</div>
            <div className="qy-aside-user-email">{data.user.email}</div>
          </div>
          {!data.user.isLocal && <UserButton />}
          {data.user.isLocal && <Link href="/" className="qy-aside-link">Back to home</Link>}
        </div>
      </aside>

      <div className="qy-main">
        <header className="qy-topbar">
          <div className="qy-topbar-status">
            <span className="qy-pill-dot" />
            <span className="qy-overline">
              {data.dataStatus === 'live' ? 'Live · updated hourly' : 'Curated fallback'}
            </span>
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
                user={data.user}
                settings={data.settings}
                notifications={data.notifications}
                capital={capital} setCapital={setCapital}
                onSave={saveSettings}
                onToggleChannel={toggleNotificationChannel}
                onConnectTelegram={connectTelegram}
              />
            )}
          </div>
      </div>

      <div className="qy-toast-wrap" aria-live="polite">
        {toasts.items.map((t) => (
          <div key={t.id} className={`qy-toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
      <nav className="qy-bottom-nav">
        {navItems.map(({ tab: t, label, Icon }) => (
          <button
            key={t}
            type="button"
            className={`qy-bottom-nav-item ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

/* ---------- Sparkline cell ---------- */

function SparklineCell({ poolId }: { poolId: string }) {
  const [data, setData] = useState<number[] | null>(null)
  useEffect(() => {
    let cancelled = false
    fetchSparkline(poolId).then((d) => { if (!cancelled) setData(d) })
    return () => { cancelled = true }
  }, [poolId])
  const svg = data ? renderSparklineSvg(data) : null
  if (!svg) return null
  return <span dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 6 }} />
}

/* ---------- Pool detail modal ---------- */

function PoolDetailModal({ opportunity, onClose }: { opportunity: Opportunity | null; onClose: () => void }) {
  const [chartData, setChartData] = useState<number[]>([])
  useEffect(() => {
    if (!opportunity || !opportunity.id.startsWith('live-')) return
    let cancelled = false
    fetchSparkline(opportunity.id).then((d) => { if (!cancelled) setChartData(d.slice(-30)) })
    return () => { cancelled = true }
  }, [opportunity])
  if (!opportunity) return null
  return (
    <div className="qy-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="qy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qy-modal-header">
          <div>
            <h2>{opportunity.platform}</h2>
            <p className="qy-asset-meta">{opportunity.chain} · {opportunity.asset} · {opportunity.category}</p>
          </div>
          <button onClick={onClose} className="qy-icon-btn" aria-label="Close">&times;</button>
        </div>
        <div className="qy-modal-body">
          <div className="qy-modal-stats">
            <div><span className="qy-overline">APY</span><span className="qy-num bold" style={{ fontSize: 28, color: 'var(--ink)' }}>{opportunity.apy.toFixed(2)}%</span></div>
            <div><span className="qy-overline">TVL</span><span className="qy-num bold" style={{ fontSize: 20 }}>{opportunity.tvl}</span></div>
            <div><span className="qy-overline">Risk</span><span className={`qy-tag-mini qy-risk-${opportunity.risk.toLowerCase()}`}>{opportunity.risk}</span></div>
            <div><span className="qy-overline">Confidence</span><span className="qy-num bold">{opportunity.confidence}/100</span></div>
          </div>
          {chartData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="qy-overline" style={{ marginBottom: 12 }}>30-day APY history</div>
              <svg viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 80 }}>
                <polyline
                  points={chartData.map((v, i) => `${(i / (chartData.length - 1)) * 300},${100 - ((v - Math.min(...chartData)) / (Math.max(...chartData) - Math.min(...chartData) || 1)) * 80}`).join(' ')}
                  fill="none" stroke="var(--signal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          {opportunity.notes && (
            <div style={{ marginTop: 24 }}>
              <div className="qy-overline" style={{ marginBottom: 8 }}>Notes</div>
              <p style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.6 }}>{opportunity.notes}</p>
            </div>
          )}
        </div>
        <div className="qy-modal-footer">
          {opportunity.actionUrl && (
            <a href={opportunity.actionUrl} target="_blank" rel="noreferrer" className="qy-btn qy-btn-primary">
              Visit Protocol <ExternalLink size={14} />
            </a>
          )}
          <button onClick={onClose} className="qy-btn qy-btn-secondary">Close</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Sub views ---------- */

function OpportunitiesView({
  data, chain, setChain, risk, setRisk, time, setTime, category, setCategory,
  query, setQuery, watched, onToggleWatch,
}: {
  data: DashboardData; chain: string; setChain: (v: string) => void;
  risk: string; setRisk: (v: string) => void;
  time: string; setTime: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  query: string; setQuery: (v: string) => void;
  watched: Set<string>;
  onToggleWatch: (id: string) => Promise<void>;
}) {
  const [sortBy, setSortBy] = useState<'apy' | 'tvl'>('apy')
  const [detail, setDetail] = useState<Opportunity | null>(null)
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

  function apyColor(apy: number): string {
    if (apy === 0) return 'qy-apy-task'
    if (apy >= 8) return 'qy-apy-high'
    if (apy >= 4) return 'qy-apy-mid'
    return 'qy-apy-low'
  }

  const protocolColors: Record<string, string> = {
    'aave': '#E8E0FE', 'jito': '#FFF0E0', 'maple': '#E8F5E9',
    'lido': '#E3F2FD', 'ether fi': '#E0F4F1', 'rocket pool': '#FFEBEE',
    'spark': '#FFF8E1', 'kelp': '#F5F5F5', 'binance': '#FFF0E0',
    'coinbase': '#E3F2FD', 'layer3': '#F5F5F5', 'pendle': '#E8E0FE',
    'morpho': '#E0F4F1', 'compound': '#E8F5E9', 'curve': '#FFEBEE',
    'yearn': '#E8E0FE', 'balancer': '#FFF8E1',
  }

  function protocolInitials(platform: string): string {
    const parts = platform.split(' ')
    if (parts.length >= 2) return parts[0].slice(0, 1).toUpperCase() + parts[1].slice(0, 1).toLowerCase()
    return platform.slice(0, 2).toLowerCase()
  }

  function protocolColor(platform: string): string {
    const key = platform.toLowerCase()
    for (const [name, color] of Object.entries(protocolColors)) {
      if (key.includes(name)) return color
    }
    return '#F0F0F0'
  }

  return (
    <div className="qy-page" data-testid="opportunities-page">
      <div className="qy-page-header">
        <span className="qy-overline qy-overline-signal">Live scanner</span>
        <h1>Opportunities</h1>
        <p>{data.opportunities.length} matches · {formatTvl(totalTvl)} TVL · avg APY {avgApy.toFixed(1)}%</p>
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
            style={{ animationDelay: `${Math.min(i * 0.015, 0.4)}s`, cursor: 'pointer' }}
            data-testid="opp-row"
            onClick={() => setDetail(o)}
          >
            <div className="qy-asset-cell">
              <div className="qy-asset-icon" style={{ backgroundColor: protocolColor(o.platform) }}>{protocolInitials(o.platform)}</div>
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
            <span className={`qy-num bold ${apyColor(o.apy)}`}>
              {o.apy ? `${o.apy.toFixed(2)}%` : 'Task'}
              {o.id.startsWith('live-') && <SparklineCell poolId={o.id} />}
            </span>
            <div className="qy-actions" onClick={(e) => e.stopPropagation()}>
              {o.actionUrl && (
                <a href={o.actionUrl} target="_blank" rel="noreferrer" className="qy-btn qy-btn-sm qy-btn-outline" title="Visit protocol">
                  Visit Protocol <ExternalLink size={12} />
                </a>
              )}
              <button
                className={`qy-btn qy-btn-sm ${watched.has(o.id) ? 'qy-btn-disabled' : 'qy-btn-watch'}`}
                onClick={() => onToggleWatch(o.id)}
                disabled={watched.has(o.id)}
                data-testid="opp-add-watch"
              >{watched.has(o.id) ? 'Watched' : '+ Watch'}</button>
            </div>
          </div>
        ))}
      </div>
      <PoolDetailModal opportunity={detail} onClose={() => setDetail(null)} />
    </div>
  )
}

function WatchlistView({ items, onRemove, onCreateAlert }: { items: Opportunity[]; onRemove: (id: string) => void; onCreateAlert: (o: Opportunity) => void }) {
  function apyColor(apy: number): string {
    if (apy === 0) return 'qy-apy-task'
    if (apy >= 8) return 'qy-apy-high'
    if (apy >= 4) return 'qy-apy-mid'
    return 'qy-apy-low'
  }

  const protocolColors: Record<string, string> = {
    'aave': '#E8E0FE', 'jito': '#FFF0E0', 'maple': '#E8F5E9',
    'lido': '#E3F2FD', 'ether fi': '#E0F4F1', 'rocket pool': '#FFEBEE',
    'spark': '#FFF8E1', 'kelp': '#F5F5F5', 'binance': '#FFF0E0',
    'coinbase': '#E3F2FD', 'layer3': '#F5F5F5',
  }

  function protocolInitials(platform: string): string {
    const parts = platform.split(' ')
    if (parts.length >= 2) return parts[0].slice(0, 1).toUpperCase() + parts[1].slice(0, 1).toLowerCase()
    return platform.slice(0, 2).toLowerCase()
  }

  function protocolColor(platform: string): string {
    const key = platform.toLowerCase()
    for (const [name, color] of Object.entries(protocolColors)) {
      if (key.includes(name)) return color
    }
    return '#F0F0F0'
  }
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
                <div className="qy-asset-icon" style={{ backgroundColor: protocolColor(o.platform) }}>{protocolInitials(o.platform)}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="qy-asset-name">{o.platform}</div>
                  <div className="qy-asset-meta">{o.chain} · {o.asset}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="qy-overline">APY</div>
                  <div className={`qy-num bold ${apyColor(o.apy)}`}>{o.apy.toFixed(2)}%</div>
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

function SettingsView({ user, settings, notifications, capital, setCapital, onSave, onToggleChannel, onConnectTelegram }: {
  user: DashboardUser; settings: UserSettings; notifications: NotificationStatus; capital: number; setCapital: (v: number) => void;
  onSave: (s: Partial<UserSettings>) => Promise<void>;
  onToggleChannel: (type: 'email' | 'telegram', enabled: boolean) => Promise<void>;
  onConnectTelegram: () => Promise<void>;
}) {
  const [freq, setFreq] = useState<'instant' | 'daily' | 'weekly'>('daily')
  const emailOpt = notifications.email.enabled

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
          <p>Signed in as {user.email}. Defaults are saved server-side for this account.</p>
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
          <p>Telegram is best for fast trader alerts. Email stays available as a backup channel.</p>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Email alerts enabled</strong>
              <span>{notifications.email.destination ?? 'Uses your Clerk account email once available.'}</span>
            </div>
            <button
              type="button"
              className={`qy-toggle ${emailOpt ? 'on' : ''}`}
              onClick={() => { const next = !emailOpt; onToggleChannel('email', next); onSave({ emailOptIn: next }) }}
              data-testid="toggle-notifications"
              aria-label="Toggle notifications"
            />
          </div>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Telegram alerts</strong>
              <span>{notifications.telegram.connected ? `Connected${notifications.telegram.username ? ` as ${notifications.telegram.username}` : ''}` : 'Connect your Telegram chat for fast alerts.'}</span>
            </div>
            {notifications.telegram.connected ? (
              <button
                type="button"
                className={`qy-toggle ${notifications.telegram.enabled ? 'on' : ''}`}
                onClick={() => onToggleChannel('telegram', !notifications.telegram.enabled)}
                data-testid="toggle-telegram"
                aria-label="Toggle Telegram alerts"
              />
            ) : (
              <button type="button" className="qy-btn qy-btn-secondary" onClick={onConnectTelegram} data-testid="connect-telegram">
                Connect Telegram
              </button>
            )}
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
