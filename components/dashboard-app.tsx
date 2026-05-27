'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  Bell,
  BellOff,
  Bookmark,
  Filter,
  LayoutDashboard,
  Settings as SettingsIcon,
  Target,
  Trash2,
} from 'lucide-react'
import { categories, chains, timeCosts } from '../lib/constants'
import { formatTvl } from '../lib/scoring'
import { fetchSparkline, renderSparklineSvg } from '../lib/chart'
import { AlertTargetDialog, alertDraftFromOpportunity, type AlertDraft } from './alert-target-dialog'
import { ProtocolLogo } from './protocol-logo'
import type { AlertRule, DashboardData, DashboardUser, NotificationStatus, Opportunity, UserSettings } from '../lib/types'

type Tab = 'markets' | 'watchlist' | 'alerts' | 'settings'
type Toast = { id: number; type: 'success' | 'error'; msg: string }

const navItems: { tab: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { tab: 'markets', label: 'Markets', icon: LayoutDashboard },
  { tab: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { tab: 'alerts', label: 'Alerts', icon: Bell },
  { tab: 'settings', label: 'Settings', icon: SettingsIcon },
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
  const [tab, setTab] = useState<Tab>('markets')
  const [chain, setChain] = useState(initialData.settings.chain)
  const [risk, setRisk] = useState(initialData.settings.risk)
  const [time, setTime] = useState(initialData.settings.time)
  const [category, setCategory] = useState(initialData.settings.category)
  const [query, setQuery] = useState('')
  const [capital, setCapital] = useState(initialData.settings.capital)
  const [alertDraft, setAlertDraft] = useState<AlertDraft | null>(null)
  const [, startTransition] = useTransition()
  const toasts = useToasts()

  const watched = useMemo(() => new Set(data.watchlist), [data.watchlist])
  const watchedOps = useMemo(() => data.opportunities.filter((item) => watched.has(item.id)), [data.opportunities, watched])

  function refreshOpportunities(next = { chain, risk, time, category, q: query, capital }) {
    const params = new URLSearchParams({
      chain: next.chain,
      risk: next.risk,
      time: next.time,
      category: next.category,
      q: next.q,
      capital: String(next.capital),
    })
    startTransition(async () => {
      const response = await fetch(`/api/opportunities?${params}`)
      const result = await response.json()
      setData((current) => ({ ...current, ...result }))
    })
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

  return (
    <div className="qy-app qy-terminal-app">
      <aside className="qy-aside" data-testid="dash-sidebar">
        <div className="qy-aside-head">
          <Link href="/" className="qy-logo">
            <span className="qy-logo-mark"><span /><span /><span /></span>
            <span className="qy-logo-text">QuickYield</span>
          </Link>
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
            <span className="qy-mono qy-topbar-updated">Updated {new Date(data.lastUpdated).toLocaleTimeString()}</span>
          </div>
          <div className="qy-terminal-topbar-actions">
            <Link href="/analytics" className="qy-btn qy-btn-secondary qy-btn-sm">Market overview</Link>
            {!data.user.isLocal && <UserButton />}
          </div>
        </header>

        <div className="qy-fade-up" style={{ animationDuration: '0.35s' }}>
          {tab === 'markets' && (
            <MarketsView
              data={data}
              watched={watched}
              chain={chain}
              risk={risk}
              time={time}
              category={category}
              query={query}
              onChain={(value) => { setChain(value); refreshOpportunities({ chain: value, risk, time, category, q: query, capital }) }}
              onRisk={(value) => { setRisk(value); refreshOpportunities({ chain, risk: value, time, category, q: query, capital }) }}
              onTime={(value) => { setTime(value); refreshOpportunities({ chain, risk, time: value, category, q: query, capital }) }}
              onCategory={(value) => { setCategory(value); refreshOpportunities({ chain, risk, time, category: value, q: query, capital }) }}
              onQuery={(value) => { setQuery(value); refreshOpportunities({ chain, risk, time, category, q: value, capital }) }}
              onToggleWatch={toggleWatch}
              onCreateAlert={openAlertBuilder}
            />
          )}
          {tab === 'watchlist' && (
            <WatchlistView items={watchedOps} onRemove={toggleWatch} onCreateAlert={openAlertBuilder} />
          )}
          {tab === 'alerts' && (
            <AlertsView alerts={data.alerts} onDelete={deleteAlert} onToggle={toggleAlert} onCreate={() => openAlertBuilder()} />
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

function MarketsView({
  data,
  watched,
  chain,
  risk,
  time,
  category,
  query,
  onChain,
  onRisk,
  onTime,
  onCategory,
  onQuery,
  onToggleWatch,
  onCreateAlert,
}: {
  data: DashboardData
  watched: Set<string>
  chain: string
  risk: string
  time: string
  category: string
  query: string
  onChain: (value: string) => void
  onRisk: (value: string) => void
  onTime: (value: string) => void
  onCategory: (value: string) => void
  onQuery: (value: string) => void
  onToggleWatch: (id: string) => Promise<void>
  onCreateAlert: (item: Opportunity) => void
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

  const totalTvl = data.opportunities.reduce((sum, item) => sum + item.tvlUsd, 0)
  const avgScore = data.opportunities.length ? Math.round(data.opportunities.reduce((sum, item) => sum + item.confidence, 0) / data.opportunities.length) : 0

  return (
    <section className="qy-page qy-terminal-page" data-testid="markets-page">
      <div className="qy-page-header qy-terminal-header">
        <div>
          <span className="qy-overline qy-overline-signal">Private yield terminal</span>
          <h1>Markets</h1>
          <p>{data.opportunities.length} tracked pools, {formatTvl(totalTvl)} total TVL, QuickYield score avg {avgScore}</p>
        </div>
        <div className="qy-terminal-kpis">
          <div className="qy-terminal-kpi"><span className="qy-overline">Screened</span><strong>{data.opportunities.filter((item) => item.risk === 'Low').length}</strong></div>
          <div className="qy-terminal-kpi"><span className="qy-overline">Universe cap</span><strong>500</strong></div>
        </div>
      </div>

      <div className="qy-filters qy-terminal-filters" data-testid="filters">
        <div className="qy-filter-label"><Filter size={14} /><span className="qy-overline">Filter</span></div>
        <select className="qy-input" value={chain} onChange={(event) => onChain(event.target.value)}>{chains.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <input className="qy-input qy-market-search" placeholder="Search pool, asset, or protocol" value={query} onChange={(event) => onQuery(event.target.value)} />
        <select className="qy-input" value={category} onChange={(event) => onCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select className="qy-input" value={risk} onChange={(event) => onRisk(event.target.value)}>
          {['All risk', 'Low', 'Medium'].map((item) => <option key={item} value={item}>{item === 'Low' ? 'Lower risk only' : item}</option>)}
        </select>
        <select className="qy-input" value={time} onChange={(event) => onTime(event.target.value)}>{timeCosts.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      </div>

      <div className="qy-terminal-table-wrap">
        <div className="qy-terminal-table-head">
          <span>Pool</span>
          <button type="button" className={`qy-sort-link ${sortBy === 'apy' ? 'active' : ''}`} onClick={() => setSortBy('apy')}>APY</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'tvl' ? 'active' : ''}`} onClick={() => setSortBy('tvl')}>TVL</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'confidence' ? 'active' : ''}`} onClick={() => setSortBy('confidence')}>QY score</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'volatility' ? 'active' : ''}`} onClick={() => setSortBy('volatility')}>Volatility</button>
          <button type="button" className={`qy-sort-link ${sortBy === 'updated' ? 'active' : ''}`} onClick={() => setSortBy('updated')}>Updated</button>
          <span>Actions</span>
        </div>

        {sorted.map((item) => (
          <div key={item.id} className="qy-terminal-row">
            <Link href={`/dashboard/pools/${encodeURIComponent(item.id)}`} className="qy-terminal-pool">
              <ProtocolLogo name={item.platform} logoUrl={item.logoUrl} />
              <div className="qy-terminal-pool-copy">
                <div className="qy-asset-name">
                  <span>{item.platform}</span>
                  <span className={`qy-tag-mini ${item.risk === 'Low' ? 'qy-risk-low' : 'qy-risk-medium'}`}>
                    {item.risk === 'Low' ? 'Lower risk' : 'Review'}
                  </span>
                </div>
                <div className="qy-asset-meta">{item.asset} / {item.chain} / {item.category}</div>
              </div>
            </Link>

            <div className="qy-terminal-metric">
              <strong>{item.apy.toFixed(2)}%</strong>
              <SparklineCell poolId={item.id} />
            </div>
            <div className="qy-terminal-metric qy-terminal-right"><strong>{item.tvl}</strong></div>
            <div className="qy-terminal-metric">
              <strong>{item.confidence}</strong>
              <span className="qy-terminal-submetric">{item.dataCompleteness}% data</span>
            </div>
            <div className="qy-terminal-metric">
              <strong>{item.volatility.toFixed(2)}%</strong>
              <span className="qy-terminal-submetric">24h move</span>
            </div>
            <div className="qy-terminal-metric qy-terminal-right">
              <strong>{new Date(item.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
            <div className="qy-terminal-actions">
              <Link href={`/dashboard/pools/${encodeURIComponent(item.id)}`} className="qy-btn qy-btn-sm qy-btn-outline">
                Research
              </Link>
              <button type="button" className="qy-icon-btn" onClick={() => onCreateAlert(item)} title="Create alert"><Bell size={14} /></button>
              <button type="button" className={`qy-btn qy-btn-sm ${watched.has(item.id) ? 'qy-btn-disabled' : 'qy-btn-watch'}`} onClick={() => onToggleWatch(item.id)} disabled={watched.has(item.id)}>
                {watched.has(item.id) ? 'Saved' : '+ Watch'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function WatchlistView({
  items,
  onRemove,
  onCreateAlert,
}: {
  items: Opportunity[]
  onRemove: (id: string) => Promise<void>
  onCreateAlert: (item: Opportunity) => void
}) {
  return (
    <section className="qy-page" data-testid="watchlist-page">
      <div className="qy-page-header">
        <span className="qy-overline qy-overline-signal">Tracked by you</span>
        <h1>Watchlist</h1>
        <p>Saved pools and the faster path back into each detail page.</p>
      </div>
      {items.length === 0 ? (
        <div className="qy-empty">
          <Bookmark className="qy-empty-icon" />
          <h3>No pools saved yet</h3>
          <p>Use the market table to save pools you want to monitor more closely.</p>
        </div>
      ) : (
        <div className="qy-watchlist-grid">
          {items.map((item) => (
            <div key={item.id} className="qy-watchlist-card">
              <div className="qy-watchlist-card-top">
                <div className="qy-asset-cell">
                  <ProtocolLogo name={item.platform} logoUrl={item.logoUrl} />
                  <div>
                    <div className="qy-asset-name">{item.platform}</div>
                    <div className="qy-asset-meta">{item.asset} / {item.chain}</div>
                  </div>
                </div>
                <span className={`qy-tag-mini ${item.risk === 'Low' ? 'qy-risk-low' : 'qy-risk-medium'}`}>
                  {item.risk === 'Low' ? 'Lower risk' : 'Review'}
                </span>
              </div>
              <div className="qy-watchlist-metrics">
                <div><span className="qy-overline">APY</span><strong>{item.apy.toFixed(2)}%</strong></div>
                <div><span className="qy-overline">TVL</span><strong>{item.tvl}</strong></div>
                <div><span className="qy-overline">QY score</span><strong>{item.confidence}</strong></div>
              </div>
              <div className="qy-terminal-actions">
                <Link href={`/dashboard/pools/${encodeURIComponent(item.id)}`} className="qy-btn qy-btn-secondary qy-btn-sm">Open page</Link>
                <button type="button" className="qy-icon-btn" onClick={() => onCreateAlert(item)} title="Create alert"><Bell size={14} /></button>
                <button type="button" className="qy-icon-btn danger" onClick={() => onRemove(item.id)} title="Remove"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AlertsView({
  alerts,
  onDelete,
  onToggle,
  onCreate,
}: {
  alerts: AlertRule[]
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
          <p>Private rules for yield changes you actually care about.</p>
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
          <p>Create a target with APY, asset, chain, risk, and confidence rules.</p>
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
            <span>Min APY</span>
            <span>Frequency</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>
          {alerts.map((alert) => (
            <div key={alert.id} className="qy-table-row" style={{ gridTemplateColumns: '4fr 2fr 2fr 2fr 1fr', opacity: alert.enabled ? 1 : 0.55 }}>
              <div>
                <div className="qy-asset-name">{alert.name}</div>
                <div className="qy-asset-meta">{alert.chain} / {alert.category}</div>
              </div>
              <span className="qy-mono">{alert.asset}</span>
              <span className="qy-num bold">{alert.minApy}%</span>
              <span className="qy-mono">{alert.frequency}</span>
              <div className="qy-actions">
                <button type="button" className="qy-icon-btn" onClick={() => onToggle(alert)}>{alert.enabled ? <Bell size={14} /> : <BellOff size={14} />}</button>
                <button type="button" className="qy-icon-btn danger" onClick={() => onDelete(alert.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
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
}: {
  user: DashboardUser
  notifications: NotificationStatus
  capital: number
  setCapital: (value: number) => void
  onSave: (settings: Partial<UserSettings>) => Promise<void>
  onToggleChannel: (type: 'email' | 'telegram', enabled: boolean) => Promise<void>
  onConnectTelegram: () => Promise<void>
}) {
  return (
    <section className="qy-page" data-testid="settings-page">
      <div className="qy-page-header">
        <span className="qy-overline qy-overline-signal">Account</span>
        <h1>Settings</h1>
        <p>Private notification and sizing defaults for this account.</p>
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
            <button type="button" className={`qy-toggle ${notifications.email.enabled ? 'on' : ''}`} onClick={() => onToggleChannel('email', !notifications.email.enabled)} />
          </div>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Telegram</strong>
              <span>{notifications.telegram.connected ? `Connected${notifications.telegram.username ? ` as ${notifications.telegram.username}` : ''}` : 'Connect your Telegram bot chat for faster alerts.'}</span>
            </div>
            {notifications.telegram.connected ? (
              <button type="button" className={`qy-toggle ${notifications.telegram.enabled ? 'on' : ''}`} onClick={() => onToggleChannel('telegram', !notifications.telegram.enabled)} />
            ) : (
              <button type="button" className="qy-btn qy-btn-secondary" onClick={onConnectTelegram}>Connect Telegram</button>
            )}
          </div>
        </section>

        <section className="qy-set-section">
          <h3>Method</h3>
          <p>QuickYield combines live market-feed data with internal ranking, data completeness, and volatility screens. It is a research terminal, not an execution product.</p>
        </section>
      </div>
    </section>
  )
}
