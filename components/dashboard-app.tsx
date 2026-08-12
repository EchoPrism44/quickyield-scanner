'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { Bell, Bookmark, Briefcase, PanelLeftClose, PanelLeftOpen, Radar, Settings as SettingsIcon } from 'lucide-react'
import { AlertTargetDialog, alertDraftFromOpportunity, type AlertDraft } from './alert-target-dialog'
import { Onboarding } from './onboarding'
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

function SignedOutCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="qy-page">
      <div className="qy-empty" data-testid="signed-out-card">
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginBottom: 8 }}>{title}</h2>
        <p style={{ color: 'var(--ink-dim)', maxWidth: '46ch', margin: '0 auto 20px' }}>{body}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-in?redirect_url=/terminal" className="qy-btn qy-btn-primary">Sign in</Link>
          <Link href="/sign-up" className="qy-btn qy-btn-secondary">Create free account</Link>
        </div>
      </div>
    </div>
  )
}

export function DashboardApp({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData)
  const [tab, setTab] = useState<Tab>('discover')
  // Collapsed sidebar is a per-person preference, so it persists. Read on mount
  // rather than in the initialiser to keep the server and first client render
  // identical (otherwise hydration mismatches).
  const [navCollapsed, setNavCollapsed] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only read on mount, intentional to avoid hydration mismatch
    setNavCollapsed(window.localStorage.getItem('qy-nav-collapsed') === '1')
  }, [])
  useEffect(() => {
    window.localStorage.setItem('qy-nav-collapsed', navCollapsed ? '1' : '0')
  }, [navCollapsed])
  const isAnonymous = Boolean(initialData.user.isAnonymous)
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
    if (tab !== 'alerts' || isAnonymous) return
    void refreshActivity()
  }, [tab, isAnonymous])

  useEffect(() => {
    if (isAnonymous) return
    void refreshActivity()
  }, [isAnonymous])

  /** Route anonymous visitors to sign-in the moment they try a user action. */
  function requireSignIn(): boolean {
    if (!isAnonymous) return false
    window.location.href = '/sign-in?redirect_url=/terminal'
    return true
  }

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
    if (requireSignIn()) return
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
    if (requireSignIn()) return
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
      <Onboarding />
      {/* Only way back once the sidebar is fully collapsed. */}
      <button
        type="button"
        className={`qy-aside-reveal ${navCollapsed ? 'qy-aside-reveal--on' : ''}`}
        onClick={() => setNavCollapsed(false)}
        title="Show sidebar"
        aria-label="Show sidebar"
      >
        <PanelLeftOpen size={17} />
      </button>
      <aside className={`qy-aside ${navCollapsed ? 'qy-aside--collapsed' : ''}`} data-testid="dash-sidebar">
        <div className="qy-aside-head">
          <BrandLogo href="/" />
          <button
            type="button"
            className="qy-aside-collapse"
            onClick={() => setNavCollapsed(true)}
            title="Hide sidebar"
            aria-label="Hide sidebar"
            aria-expanded={!navCollapsed}
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
        <nav className="qy-aside-nav">
          {navItems.map(({ tab: itemTab, label, icon: Icon }) => (
            <button
              key={itemTab}
              type="button"
              className={`qy-aside-link ${tab === itemTab ? 'active' : ''}`}
              onClick={() => setTab(itemTab)}
              title={navCollapsed ? label : undefined}
              aria-label={label}
            >
              <Icon className="qy-aside-icon" />
              <span className="qy-aside-label">{label}</span>
            </button>
          ))}
        </nav>
        <div className="qy-aside-foot">
          {isAnonymous ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <Link href="/sign-in?redirect_url=/terminal" className="qy-btn qy-btn-primary qy-btn-sm" style={{ justifyContent: 'center' }}>Sign in</Link>
              <Link href="/sign-up" className="qy-btn qy-btn-secondary qy-btn-sm" style={{ justifyContent: 'center' }}>Create account</Link>
            </div>
          ) : (
            <>
              <div className="qy-aside-user">
                <div className="qy-aside-user-label">{data.user.name}</div>
                <div className="qy-aside-user-email">{data.user.email}</div>
              </div>
              {!data.user.isLocal && <UserButton />}
            </>
          )}
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
            {/* No "Landing page" button — the sidebar logo already links home. */}
            {isAnonymous ? (
              <Link href="/sign-in?redirect_url=/terminal" className="qy-btn qy-btn-primary qy-btn-sm">Sign in</Link>
            ) : (
              !data.user.isLocal && <UserButton />
            )}
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
            isAnonymous ? (
              <SignedOutCard
                title="Your watchlist lives here"
                body="Sign in to save pools, track their APY and Safety Grade moves, and get the weekly digest for the pools you care about."
              />
            ) : (
            <WatchlistView
              watched={watched}
              onToggleWatch={toggleWatch}
              onCreateAlert={openAlertBuilder}
              onGoDiscover={() => setTab('discover')}
            />
            )
          )}
          {tab === 'portfolio' && (
            isAnonymous ? (
              <SignedOutCard
                title="Track your positions here"
                body="Sign in to record what you're holding and watch its grade over time. Read-only — Litmus never touches your funds or wallet."
              />
            ) : (
            <PortfolioView
              onGoDiscover={() => setTab('discover')}
              pushToast={toasts.push}
            />
            )
          )}
          {tab === 'alerts' && (
            isAnonymous ? (
              <SignedOutCard
                title="Alerts need an account"
                body="Sign in to set plain-language rules — APY thresholds, TVL drains, reward spikes — and get Telegram or email alerts the moment a pool matches."
              />
            ) : (
            <AlertsView alerts={data.alerts} activity={activity} onDelete={deleteAlert} onToggle={toggleAlert} onCreate={() => openAlertBuilder()} />
            )
          )}
          {tab === 'settings' && isAnonymous && (
            <SignedOutCard
              title="Settings are per-account"
              body="Sign in to configure notification channels, your capital assumption, and the weekly digest."
            />
          )}
          {tab === 'settings' && !isAnonymous && (
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
              digestEnabled={data.settings.digestEnabled ?? true}
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
