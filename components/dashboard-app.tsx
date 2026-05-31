'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  Bell,
  BellOff,
  Bookmark,
  CheckCircle2,
  Filter,
  LayoutDashboard,
  Radar,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Trash2,
} from 'lucide-react'
import { categories, chains, timeCosts } from '../lib/constants'
import { fetchSparkline, renderSparklineSvg } from '../lib/chart'
import { AlertTargetDialog, alertDraftFromOpportunity, type AlertDraft } from './alert-target-dialog'
import { BrandLogo } from './brand-logo'
import { ProtocolLogo } from './protocol-logo'
import type { AlertActivity, AlertRule, DashboardData, DashboardUser, NotificationStatus, Opportunity, OpportunityPreset, UserSettings } from '../lib/types'

type Tab = 'discover' | 'alerts' | 'settings'
type Toast = { id: number; type: 'success' | 'error'; msg: string }

const navItems: { tab: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { tab: 'discover', label: 'Discover', icon: Radar },
  { tab: 'alerts', label: 'Alerts', icon: Bell },
  { tab: 'settings', label: 'Settings', icon: SettingsIcon },
]

const presetItems: { key: OpportunityPreset | 'all'; label: string }[] = [
  { key: 'all', label: 'All pools' },
  { key: 'safe-stablecoins', label: 'Safer stablecoins' },
  { key: 'eth-staking', label: 'ETH staking' },
  { key: 'solana-yield', label: 'Solana yield' },
  { key: 'high-apy', label: 'High APY' },
  { key: 'saved', label: 'Saved' },
]

function useToasts() {
  const [items, setItems] = useState<Toast[]>([])
  function push(type: Toast['type'], msg: string) {
    const id = Date.now() + Math.random()
    setItems((current) => [...current, { id, type, msg }])
    setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3500)
  }
  return { items, push }
}

export function DashboardApp({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData)
  const [tab, setTab] = useState<Tab>('discover')
  const [chain, setChain] = useState(initialData.settings.chain)
  const [risk, setRisk] = useState(initialData.settings.risk)
  const [time, setTime] = useState(initialData.settings.time)
  const [category, setCategory] = useState(initialData.settings.category)
  const [query, setQuery] = useState('')
  const [capital, setCapital] = useState(initialData.settings.capital)
  const [preset, setPreset] = useState<OpportunityPreset | 'all'>('all')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [activity, setActivity] = useState<AlertActivity[]>([])
  const [testingNotification, setTestingNotification] = useState(false)
  const [alertDraft, setAlertDraft] = useState<AlertDraft | null>(null)
  const [, startTransition] = useTransition()
  const toasts = useToasts()

  const watched = useMemo(() => new Set(data.watchlist), [data.watchlist])

  useEffect(() => {
    if (tab !== 'alerts') return
    void refreshActivity()
  }, [tab])

  useEffect(() => {
    void refreshActivity()
  }, [])

  function opportunityParams(next = { chain, risk, time, category, q: query, capital, preset, page: 1 }) {
    const params = new URLSearchParams({
      chain: next.chain,
      risk: next.risk,
      time: next.time,
      category: next.category,
      q: next.q,
      capital: String(next.capital),
      page: String(next.page),
      pageSize: '50',
    })
    if (next.preset !== 'all') params.set('preset', next.preset)
    return params
  }

  function refreshOpportunities(next = { chain, risk, time, category, q: query, capital, preset, page: 1 }) {
    const params = opportunityParams(next)
    startTransition(async () => {
      const response = await fetch(`/api/opportunities?${params}`)
      const result = await response.json()
      setData((current) => ({ ...current, ...result }))
    })
  }

  function loadMore() {
    const params = opportunityParams({ chain, risk, time, category, q: query, capital, preset, page: data.page + 1 })
    startTransition(async () => {
      const response = await fetch(`/api/opportunities?${params}`)
      const result = await response.json()
      if (!response.ok) return
      setData((current) => ({
        ...current,
        ...result,
        opportunities: [...current.opportunities, ...(result.opportunities ?? [])],
      }))
    })
  }

  async function refreshActivity() {
    const response = await fetch('/api/alerts/activity')
    const result = await response.json()
    if (response.ok) setActivity(result.activity ?? [])
  }

  async function toggleWatch(opportunityId: string) {
    const isWatching = watched.has(opportunityId)
    const response = isWatching
      ? await fetch(`/api/watchlist/${encodeURIComponent(opportunityId)}`, { method: 'DELETE' })
      : await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunityId }),
        })
    const result = await response.json()
    if (response.ok) {
      setData((current) => ({ ...current, watchlist: result.items }))
      toasts.push('success', isWatching ? 'Removed from watchlist' : 'Added to watchlist')
    } else {
      toasts.push('error', result?.error || 'Watchlist update failed')
    }
  }

  function openAlertBuilder(item?: Opportunity) {
    setAlertDraft(alertDraftFromOpportunity(item, { chain, category }))
  }

  async function createAlert(draft: AlertDraft) {
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, enabled: true }),
    })
    const result = await response.json()
    if (response.ok) {
      setData((current) => ({ ...current, alerts: result.alerts }))
      setAlertDraft(null)
      setTab('alerts')
      toasts.push('success', 'Alert created')
      void refreshActivity()
    } else {
      toasts.push('error', result?.error || 'Alert creation failed')
    }
  }

  async function deleteAlert(alertId: string) {
    const response = await fetch(`/api/alerts/${encodeURIComponent(alertId)}`, { method: 'DELETE' })
    const result = await response.json()
    if (response.ok) {
      setData((current) => ({ ...current, alerts: result.alerts }))
      toasts.push('success', 'Alert removed')
    }
  }

  async function toggleAlert(alert: AlertRule) {
    const response = await fetch(`/api/alerts/${encodeURIComponent(alert.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !alert.enabled }),
    })
    const result = await response.json()
    if (response.ok) setData((current) => ({ ...current, alerts: result.alerts }))
  }

  async function saveSettings(patch: Partial<typeof data.settings>) {
    const next = { ...data.settings, ...patch }
    const response = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    const result = await response.json()
    if (response.ok) {
      setData((current) => ({
        ...current,
        settings: result.settings,
        notifications: result.notifications ?? current.notifications,
      }))
      toasts.push('success', 'Settings saved')
    }
  }

  async function toggleNotificationChannel(type: 'email' | 'telegram', enabled: boolean) {
    const response = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationChannels: { [type]: enabled } }),
    })
    const result = await response.json()
    if (response.ok) {
      setData((current) => ({ ...current, notifications: result.notifications ?? current.notifications }))
      toasts.push('success', `${type === 'telegram' ? 'Telegram' : 'Email'} ${enabled ? 'enabled' : 'paused'}`)
    } else {
      toasts.push('error', result?.error || 'Notification update failed')
    }
  }

  async function connectTelegram() {
    const response = await fetch('/api/notifications/telegram/connect', { method: 'POST' })
    const result = await response.json()
    if (!response.ok) {
      toasts.push('error', result?.error || 'Telegram connect failed')
      return
    }
    window.open(result.deepLink, '_blank', 'noopener,noreferrer')
    toasts.push('success', 'Telegram opened. Press Start in the bot to finish connecting.')
  }

  async function sendTestNotification() {
    setTestingNotification(true)
    try {
      const response = await fetch('/api/notifications/test', { method: 'POST' })
      const result = await response.json()
      if (response.ok) toasts.push('success', (result.results ?? ['Test alert sent']).join(' / '))
      else toasts.push('error', result?.error || 'Test alert failed')
    } finally {
      setTestingNotification(false)
    }
  }

  return (
    <div className="qy-app qy-terminal-app">
      <aside className="qy-aside" data-testid="dash-sidebar">
        <div className="qy-aside-head">
          <BrandLogo href="/" />
        </div>
        <nav className="qy-aside-nav">
          {navItems.map(({ tab: itemTab, label, icon: Icon }) => (
            <button
              key={itemTab}
              type="button"
              className={`qy-aside-link ${tab === itemTab ? 'active' : ''}`}
              onClick={() => setTab(itemTab)}
            >
              <Icon className="qy-aside-icon" />
              {label}
            </button>
          ))}
        </nav>
        <div className="qy-aside-foot">
          <div className="qy-aside-user">
            <div className="qy-aside-user-label">{data.user.name}</div>
            <div className="qy-aside-user-email">{data.user.email}</div>
          </div>
          {!data.user.isLocal && <UserButton />}
        </div>
      </aside>

      <main className="qy-main">
        <header className="qy-topbar qy-terminal-topbar">
          <div className="qy-topbar-status">
            <span className="qy-pill-dot" />
            <span className="qy-overline">
              {data.dataStatus === 'live' ? 'Live market feed' : 'Fallback market feed'}
            </span>
            <span className="qy-topbar-sep">/</span>
            <span className="qy-mono qy-topbar-updated">{data.total} pools scanned</span>
          </div>
          <div className="qy-terminal-topbar-actions">
            <Link href="/" className="qy-btn qy-btn-secondary qy-btn-sm">Landing page</Link>
            {!data.user.isLocal && <UserButton />}
          </div>
        </header>

        <div className="qy-fade-up" style={{ animationDuration: '0.35s' }}>
          {tab === 'discover' && (
            <DiscoverView
              data={data}
              watched={watched}
              chain={chain}
              risk={risk}
              time={time}
              category={category}
              query={query}
              preset={preset}
              advancedOpen={advancedOpen}
              onPreset={(value) => { setPreset(value); refreshOpportunities({ chain, risk, time, category, q: query, capital, preset: value, page: 1 }) }}
              onAdvancedOpen={() => setAdvancedOpen((current) => !current)}
              onChain={(value) => { setChain(value); refreshOpportunities({ chain: value, risk, time, category, q: query, capital, preset, page: 1 }) }}
              onRisk={(value) => { setRisk(value); refreshOpportunities({ chain, risk: value, time, category, q: query, capital, preset, page: 1 }) }}
              onTime={(value) => { setTime(value); refreshOpportunities({ chain, risk, time: value, category, q: query, capital, preset, page: 1 }) }}
              onCategory={(value) => { setCategory(value); refreshOpportunities({ chain, risk, time, category: value, q: query, capital, preset, page: 1 }) }}
              onQuery={(value) => { setQuery(value); refreshOpportunities({ chain, risk, time, category, q: value, capital, preset, page: 1 }) }}
              onToggleWatch={toggleWatch}
              onCreateAlert={openAlertBuilder}
              onLoadMore={loadMore}
              triggeredAlerts={activity.length}
            />
          )}
          {tab === 'alerts' && (
            <AlertsView alerts={data.alerts} activity={activity} onDelete={deleteAlert} onToggle={toggleAlert} onCreate={() => openAlertBuilder()} />
          )}
          {tab === 'settings' && (
            <SettingsView
              user={data.user}
              notifications={data.notifications}
              capital={capital}
              setCapital={setCapital}
              onSave={saveSettings}
              onToggleChannel={toggleNotificationChannel}
              onConnectTelegram={connectTelegram}
              onSendTest={sendTestNotification}
              testingNotification={testingNotification}
            />
          )}
        </div>
      </main>

      <div className="qy-toast-wrap" aria-live="polite">
        {toasts.items.map((toast) => (
          <div key={toast.id} className={`qy-toast ${toast.type}`}>{toast.msg}</div>
        ))}
      </div>

      {alertDraft ? (
        <AlertTargetDialog
          draft={alertDraft}
          onChange={setAlertDraft}
          onClose={() => setAlertDraft(null)}
          onSubmit={createAlert}
        />
      ) : null}

      <nav className="qy-bottom-nav">
        {navItems.map(({ tab: itemTab, label, icon: Icon }) => (
          <button
            key={itemTab}
            type="button"
            className={`qy-bottom-nav-item ${tab === itemTab ? 'active' : ''}`}
            onClick={() => setTab(itemTab)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function SparklineCell({ poolId }: { poolId: string }) {
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchSparkline(poolId).then((data) => {
      if (!cancelled) setSvg(renderSparklineSvg(data))
    })
    return () => { cancelled = true }
  }, [poolId])

  if (!svg) return <span className="qy-sparkline-placeholder">--</span>
  return <span className="qy-sparkline" dangerouslySetInnerHTML={{ __html: svg }} />
}

function DiscoverView({
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

      <div className="qy-market-map" aria-label="Market map">
        {['0-4%', '4-8%', '8-12%', '12%+'].map((band) => {
          const [min, max] = band === '12%+' ? [12, Infinity] : band.replace('%', '').split('-').map(Number)
          const items = data.opportunities.filter((item) => item.apy >= min && item.apy < max)
          const low = items.filter((item) => item.risk === 'Low').length
          return (
            <div key={band} className="qy-market-map-cell">
              <span className="qy-overline">{band} APY</span>
              <strong>{items.length}</strong>
              <small>{low} lower risk</small>
            </div>
          )
        })}
      </div>

      <div className="qy-terminal-table-wrap qy-desktop-results">
        <div className="qy-terminal-table-head">
          <span>Protocol</span>
          <span>Asset</span>
          <button type="button" className={`qy-sort-link ${sortBy === 'apy' ? 'active' : ''}`} onClick={() => setSortBy('apy')}>APY</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'volatility' ? 'active' : ''}`} onClick={() => setSortBy('volatility')}>24h Change</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'tvl' ? 'active' : ''}`} onClick={() => setSortBy('tvl')}>TVL</button>
          <span>Risk</span>
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
            <Link href={`/dashboard/pools/${encodeURIComponent(item.id)}`} className="qy-terminal-pool">
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
              <span className={`qy-tag-mini ${item.risk === 'Low' ? 'qy-risk-low' : 'qy-risk-medium'}`}>
                {item.risk === 'Low' ? 'Lower risk' : 'Review carefully'}
              </span>
              <span className="qy-terminal-submetric">{item.confidence} safety</span>
            </div>
            <div className="qy-terminal-metric">
              <strong>{item.chain}</strong>
            </div>
            <div className="qy-terminal-actions">
              <Link href={`/dashboard/pools/${encodeURIComponent(item.id)}`} className="qy-btn qy-btn-sm qy-btn-outline">
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
              <span className={`qy-tag-mini ${item.risk === 'Low' ? 'qy-risk-low' : 'qy-risk-medium'}`}>{item.risk === 'Low' ? 'Lower risk' : 'Review carefully'}</span>
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
              <Link href={`/dashboard/pools/${encodeURIComponent(item.id)}`} className="qy-btn qy-btn-sm qy-btn-outline">View details</Link>
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

function AlertsView({
  alerts,
  activity,
  onDelete,
  onToggle,
  onCreate,
}: {
  alerts: AlertRule[]
  activity: AlertActivity[]
  onDelete: (id: string) => Promise<void>
  onToggle: (alert: AlertRule) => Promise<void>
  onCreate: () => void
}) {
  return (
    <section className="qy-page" data-testid="alerts-page">
      <div className="qy-page-header qy-page-header-row">
        <div>
          <span className="qy-overline qy-overline-signal">Notifications</span>
          <h1>Alerts</h1>
          <p>Rules for yield changes you actually care about, delivered by email or Telegram.</p>
        </div>
        <button type="button" className="qy-btn qy-btn-primary" onClick={onCreate}>
          <Target size={14} />
          New target
        </button>
      </div>
      {alerts.length === 0 ? (
        <div className="qy-empty">
          <Bell className="qy-empty-icon" />
          <h3>No alerts yet</h3>
          <p>Create a target like USDC APY &gt; 15%, Risk &lt;= Medium.</p>
          <button type="button" className="qy-btn qy-btn-secondary qy-empty-action" onClick={onCreate}>
            <Target size={14} />
            Set first target
          </button>
        </div>
      ) : (
        <div className="qy-table-wrap">
          <div className="qy-table-head" style={{ gridTemplateColumns: '4fr 2fr 2fr 2fr 1fr' }}>
            <span>Rule</span>
            <span>Asset</span>
            <span>Target</span>
            <span>Frequency</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>
          {alerts.map((alert) => (
            <div key={alert.id} className="qy-table-row" style={{ gridTemplateColumns: '4fr 2fr 2fr 2fr 1fr', opacity: alert.enabled ? 1 : 0.55 }}>
              <div>
                <div className="qy-asset-name">{alert.name}</div>
                <div className="qy-asset-meta">{alert.asset || 'Any asset'} APY &gt; {alert.minApy}%, Risk &lt;= {alert.maxRisk}</div>
              </div>
              <span className="qy-mono">{alert.asset}</span>
              <span className="qy-num bold">{alert.minApy}% APY</span>
              <span className="qy-mono">{alert.frequency}</span>
              <div className="qy-actions">
                <button type="button" className="qy-icon-btn" onClick={() => onToggle(alert)} aria-label={`${alert.enabled ? 'Pause' : 'Resume'} ${alert.name}`}>{alert.enabled ? <Bell size={14} /> : <BellOff size={14} />}</button>
                <button type="button" className="qy-icon-btn danger" onClick={() => onDelete(alert.id)} aria-label={`Delete ${alert.name}`}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="qy-activity-panel" aria-label="Recent alert activity">
        <div className="qy-detail-panel-head">
          <h2>Activity</h2>
          <span className="qy-mono">{activity.length ? 'Recent deliveries' : 'No deliveries yet'}</span>
        </div>
        {activity.length === 0 ? (
          <p className="qy-detail-copy">When a target matches a scan, the delivery will appear here with the pool, APY, channel, and time.</p>
        ) : (
          <div className="qy-activity-list">
            {activity.map((item) => (
              <div key={item.id} className="qy-activity-row">
                <CheckCircle2 size={16} />
                <div>
                  <strong>{item.alertName}</strong>
                  <span>{item.platform} / {item.asset} / {item.chain}</span>
                </div>
                <div className="qy-terminal-right">
                  <strong>{item.apy.toFixed(2)}%</strong>
                  <span>{item.channel} / {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function SettingsView({
  user,
  notifications,
  capital,
  setCapital,
  onSave,
  onToggleChannel,
  onConnectTelegram,
  onSendTest,
  testingNotification,
}: {
  user: DashboardUser
  notifications: NotificationStatus
  capital: number
  setCapital: (value: number) => void
  onSave: (settings: Partial<UserSettings>) => Promise<void>
  onToggleChannel: (type: 'email' | 'telegram', enabled: boolean) => Promise<void>
  onConnectTelegram: () => Promise<void>
  onSendTest: () => Promise<void>
  testingNotification: boolean
}) {
  return (
    <section className="qy-page" data-testid="settings-page">
      <div className="qy-page-header">
        <span className="qy-overline qy-overline-signal">Account</span>
        <h1>Settings</h1>
        <p>Notification and sizing defaults for this account.</p>
      </div>

      <div className="qy-settings-shell">
        <section className="qy-set-section">
          <h3>Profile</h3>
          <p>Signed in as {user.email}. Watchlists and alerts are scoped to this account only.</p>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Tracked capital</strong>
              <span>Used for projected sizing and quick comparisons.</span>
            </div>
            <input
              className="qy-input"
              style={{ width: 120 }}
              type="number"
              aria-label="Tracked capital"
              min={25}
              max={100000}
              value={capital}
              onChange={(event) => setCapital(Number(event.target.value))}
              onBlur={() => onSave({ capital })}
            />
          </div>
        </section>

        <section className="qy-set-section">
          <h3>Notifications</h3>
          <p>Telegram is the fastest route. Email stays available as a backup record.</p>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Email</strong>
              <span>{notifications.email.destination ?? 'Uses your Clerk email when available.'}</span>
            </div>
            <button
              type="button"
              className={`qy-toggle ${notifications.email.enabled ? 'on' : ''}`}
              role="switch"
              aria-checked={notifications.email.enabled}
              aria-label="Toggle email alerts"
              onClick={() => onToggleChannel('email', !notifications.email.enabled)}
            />
          </div>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Telegram</strong>
              <span>{notifications.telegram.connected ? `Connected${notifications.telegram.username ? ` as ${notifications.telegram.username}` : ''}` : 'Connect your Telegram bot chat for faster alerts.'}</span>
            </div>
            {notifications.telegram.connected ? (
              <button
                type="button"
                className={`qy-toggle ${notifications.telegram.enabled ? 'on' : ''}`}
                role="switch"
                aria-checked={notifications.telegram.enabled}
                aria-label="Toggle Telegram alerts"
                onClick={() => onToggleChannel('telegram', !notifications.telegram.enabled)}
              />
            ) : (
              <button type="button" className="qy-btn qy-btn-secondary" onClick={onConnectTelegram}>Connect Telegram</button>
            )}
          </div>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Test alert</strong>
              <span>Send one sample alert to enabled verified channels.</span>
            </div>
            <button type="button" className="qy-btn qy-btn-secondary" onClick={onSendTest} disabled={testingNotification}>
              <Bell size={14} />
              {testingNotification ? 'Sending...' : 'Send test alert'}
            </button>
          </div>
        </section>

        <section className="qy-set-section">
          <h3><ShieldCheck size={16} /> Method</h3>
          <p>QuickYield combines live market-feed data with internal ranking, data completeness, and volatility screens. It is a research product, not an execution product.</p>
        </section>
      </div>
    </section>
  )
}
