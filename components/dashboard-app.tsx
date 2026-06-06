'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { Bell, Bookmark, Briefcase, Radar, Settings as SettingsIcon } from 'lucide-react'
import { AlertTargetDialog, alertDraftFromOpportunity, type AlertDraft } from './alert-target-dialog'
import { AppIntro } from './app-intro'
import { BrandLogo } from './brand-logo'
import { DiscoverView } from './dashboard/discover-view'
import { WatchlistView } from './dashboard/watchlist-view'
import { PortfolioView } from './dashboard/portfolio-view'
import { AlertsView } from './dashboard/alerts-view'
import { SettingsView } from './dashboard/settings-view'
import type { AlertActivity, AlertRule, DashboardData, Opportunity, OpportunityPreset } from '../lib/types'

type Tab = 'discover' | 'watchlist' | 'portfolio' | 'alerts' | 'settings'
type Toast = { id: number; type: 'success' | 'error'; msg: string }

const navItems: { tab: Tab; label: string; icon: typeof Radar }[] = [
  { tab: 'discover', label: 'Discover', icon: Radar },
  { tab: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { tab: 'portfolio', label: 'Portfolio', icon: Briefcase },
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
      <AppIntro />
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
          {tab === 'watchlist' && (
            <WatchlistView
              watched={watched}
              onToggleWatch={toggleWatch}
              onCreateAlert={openAlertBuilder}
              onGoDiscover={() => setTab('discover')}
            />
          )}
          {tab === 'portfolio' && (
            <PortfolioView
              onGoDiscover={() => setTab('discover')}
              pushToast={(type, msg) => toasts.push(type, msg)}
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
