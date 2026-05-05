'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { categories, chains, riskLevels, timeCosts } from '../lib/constants'
import { money } from '../lib/scoring'
import type { DashboardData, Opportunity } from '../lib/types'
import { Icon } from './icons'

const quickWins = [
  { title: 'USDC on Base', meta: 'Verified low-gas stablecoin route', change: '+8.4% APY' },
  { title: 'SOL staking', meta: 'Highest confidence signal today', change: '94 intel' },
  { title: 'Learn rewards', meta: 'No-capital reward surface', change: '$1-$6' },
]

const safetyChecks = ['TVL above $1M', 'Gas visible before clickout', 'APY separated from tasks', 'No profit guarantees']

function scanTimeLabel(value: string) {
  const date = new Date(value)
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const hour = hours % 12 || 12
  const period = hours >= 12 ? 'PM' : 'AM'
  return `${hour}:${minutes} ${period}`
}

export function DashboardApp({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData)
  const [capital, setCapital] = useState(initialData.settings.capital)
  const [chain, setChain] = useState(initialData.settings.chain)
  const [risk, setRisk] = useState(initialData.settings.risk)
  const [time, setTime] = useState(initialData.settings.time)
  const [category, setCategory] = useState(initialData.settings.category)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'scanner' | 'watchlist' | 'alerts' | 'settings'>('scanner')
  const [selectedId, setSelectedId] = useState(initialData.opportunities[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()

  const selected = data.opportunities.find((item) => item.id === selectedId) ?? data.opportunities[0]
  const watched = useMemo(() => new Set(data.watchlist), [data.watchlist])
  const lowRiskCount = data.opportunities.filter((item) => item.risk === 'Low').length
  const bestApy = data.opportunities.length > 0 ? Math.max(...data.opportunities.map((item) => item.apy)) : 0

  const watchedOpportunities = useMemo(
    () => data.opportunities.filter((item) => watched.has(item.id)),
    [data.opportunities, watched],
  )

  function weeklyRange(item: Opportunity) {
    return {
      low: item.dailyLow * 7 * (capital / 100),
      high: item.dailyHigh * 7 * (capital / 100),
    }
  }

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
      setSelectedId(result.opportunities[0]?.id ?? '')
    })
  }

  function resetScan() {
    setQuery('')
    setChain(chains[0])
    setRisk(riskLevels[0])
    setTime(timeCosts[0])
    setCategory(categories[0])
    refreshOpportunities({ chain: chains[0], risk: riskLevels[0], time: timeCosts[0], category: categories[0], q: '', capital })
  }

  async function toggleWatch(id: string) {
    const response = watched.has(id)
      ? await fetch(`/api/watchlist/${encodeURIComponent(id)}`, { method: 'DELETE' })
      : await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunityId: id }),
        })
    const result = await response.json()
    if (response.ok) setData((current) => ({ ...current, watchlist: result.items }))
  }

  async function createAlertFromSelected() {
    if (!selected) return
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${selected.asset} on ${selected.chain} above ${Math.max(1, Math.floor(selected.apy))}%`,
        chain: selected.chain,
        category: selected.category,
        asset: selected.asset,
        minApy: Math.max(1, Math.floor(selected.apy)),
        maxRisk: selected.risk,
        minConfidence: Math.max(70, selected.confidence - 5),
        frequency: 'daily',
        enabled: true,
      }),
    })
    const result = await response.json()
    if (response.ok) {
      setData((current) => ({ ...current, alerts: result.alerts }))
      setTab('alerts')
    }
  }

  async function updateSettings() {
    const response = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capital, chain, risk, time, category, disclosureAccepted: true }),
    })
    const result = await response.json()
    if (response.ok) setData((current) => ({ ...current, settings: result.settings }))
  }

  return (
    <main className="app-shell" id="top">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">QY</span>
          <span>
            <strong>QuickYield</strong>
            <small>SaaS Beta</small>
          </span>
        </Link>
        <nav className="top-nav" aria-label="Primary">
          <button className="nav-link" type="button" onClick={() => setTab('scanner')}>Scanner</button>
          <button className="nav-link" type="button" onClick={() => setTab('watchlist')}>Watchlist</button>
          <button className="nav-link" type="button" onClick={() => setTab('alerts')}>Alerts</button>
          <button className="nav-link" type="button" onClick={() => setTab('settings')}>Settings</button>
        </nav>
        <label className="search-box">
          <Icon name="search" />
          <span className="sr-only">Search opportunities</span>
          <input
            type="search"
            placeholder="Search protocol, chain, yield signal..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              refreshOpportunities({ chain, risk, time, category, q: event.target.value, capital })
            }}
          />
        </label>
        <button className="primary-button" type="button" onClick={createAlertFromSelected}>
          <Icon name="bell" />
          Create alert
        </button>
      </header>

      <section className="hero-panel" aria-labelledby="hero-title">
        <div>
          <p className="market-note">QuickYield SaaS Beta</p>
          <h1 id="hero-title">Trace safer crypto yield signals before you click.</h1>
          <p>
            Server-side scans, persistent watchlists, email alert rules, and risk disclosures
            for low-effort staking, stablecoin lending, exchange rewards, and simple tasks.
          </p>
        </div>
        <div className="portfolio-card" aria-labelledby="capital-label">
          <div>
            <span id="capital-label">Tracked capital</span>
            <strong>{money(capital)}</strong>
          </div>
          <input
            aria-labelledby="capital-label"
            type="range"
            min="25"
            max="1000"
            step="25"
            value={capital}
            onChange={(event) => {
              setCapital(Number(event.target.value))
              refreshOpportunities({ chain, risk, time, category, q: query, capital: Number(event.target.value) })
            }}
          />
          <div className="range-labels">
            <span>$25</span>
            <span>$1,000</span>
          </div>
        </div>
      </section>

      <section className={`data-status ${data.dataStatus}`} aria-live="polite">
        <div>
          <strong>{data.dataStatus === 'live' ? 'Live yield feed connected' : 'Curated fallback active'}</strong>
          <span>
            {data.dataStatus === 'live'
              ? `Server scan loaded at ${scanTimeLabel(data.lastUpdated)}.`
              : data.fallbackReason ?? 'Live yield data could not be reached, so vetted sample routes are shown.'}
          </span>
        </div>
        <a href="https://defillama.com/yields" target="_blank" rel="noreferrer">Data source</a>
      </section>

      <section className="market-stats" aria-label="Scanner summary">
        <Metric label="Signals tracked" value={data.opportunities.length.toString()} detail={isPending ? 'refreshing' : 'after filters'} />
        <Metric label="Peak yield" value={bestApy ? `${bestApy.toFixed(1)}%` : 'Task'} detail="current sample" />
        <Metric label="Low-risk intel" value={lowRiskCount.toString()} detail="visible now" />
        <Metric label="Active alerts" value={data.alerts.filter((alert) => alert.enabled).length.toString()} detail="email rules" />
      </section>

      <section className="dashboard-tabs" aria-label="Dashboard views">
        {(['scanner', 'watchlist', 'alerts', 'settings'] as const).map((item) => (
          <button key={item} className={`tab-button ${tab === item ? 'active' : ''}`} type="button" onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </section>

      {tab === 'scanner' && (
        <>
          <FilterBar
            chain={chain}
            risk={risk}
            time={time}
            category={category}
            onChange={(next) => {
              const merged = { chain, risk, time, category, ...next }
              setChain(merged.chain)
              setRisk(merged.risk)
              setTime(merged.time)
              setCategory(merged.category)
              refreshOpportunities({ ...merged, q: query, capital })
            }}
            onReset={resetScan}
          />
          <ScannerGrid
            opportunities={data.opportunities}
            selected={selected}
            watched={watched}
            weeklyRange={weeklyRange}
            onSelect={setSelectedId}
            onWatch={toggleWatch}
            onCreateAlert={createAlertFromSelected}
          />
        </>
      )}

      {tab === 'watchlist' && (
        <Panel title="Saved watchlist" copy="Persistent saved routes for this beta user. Free beta limit: 25 items.">
          {watchedOpportunities.length === 0 ? (
            <EmptyState title="No watched signals yet." copy="Open Scanner and star a yield signal to save it here." />
          ) : (
            <div className="mobile-cards always">
              {watchedOpportunities.map((item) => (
                <OpportunityCard key={item.id} item={item} selected={selected?.id === item.id} weeklyRange={weeklyRange(item)} onSelect={setSelectedId} />
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'alerts' && (
        <Panel title="Email alert rules" copy="Create rules from selected signals. Resend sends emails when cron finds a new or materially improved match.">
          <ol className="alert-list">
            {data.alerts.map((alert, index) => (
              <li key={alert.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{alert.name}</strong>
                  <small>{alert.chain} - {alert.category} - min {alert.minApy}% APY - {alert.minConfidence}+ score</small>
                </div>
                <em>{alert.enabled ? alert.frequency : 'off'}</em>
              </li>
            ))}
          </ol>
          {data.alerts.length === 0 && <EmptyState title="No alerts yet." copy="Select a signal and use Create alert to add the first rule." />}
        </Panel>
      )}

      {tab === 'settings' && (
        <Panel title="Beta settings" copy="Defaults are saved server-side for authenticated users and in memory for local development.">
          <div className="form-grid">
            <label className="form-row">
              <span>Capital</span>
              <input value={capital} type="number" min="25" max="100000" onChange={(event) => setCapital(Number(event.target.value))} />
            </label>
            <label className="form-row">
              <span>Email</span>
              <select defaultValue={data.settings.emailOptIn ? 'on' : 'off'}>
                <option value="on">Alerts on</option>
                <option value="off">Alerts off</option>
              </select>
            </label>
            <button className="primary-button" type="button" onClick={updateSettings}>Save settings</button>
          </div>
        </Panel>
      )}

      <section className="safety-card" id="risk" aria-labelledby="risk-title">
        <div>
          <h2 id="risk-title">Risk intelligence layer</h2>
          <p>QuickYield surfaces the boring but important risk details before users leave the scanner.</p>
        </div>
        <div className="safety-grid">
          {safetyChecks.map((check) => (
            <span key={check}>
              <Icon name="shield" />
              {check}
            </span>
          ))}
        </div>
      </section>

      <section className="disclaimer-card" aria-labelledby="disclaimer-title">
        <h2 id="disclaimer-title">Important disclosure</h2>
        <p>
          QuickYield is an informational research tool. It does not provide financial advice, custody funds,
          execute transactions, guarantee returns, or verify that an external protocol is safe. Always review
          the destination platform, fees, lockups, smart-contract risk, tax impact, and regional availability
          before depositing assets.
        </p>
      </section>
    </main>
  )
}

function FilterBar({ chain, risk, time, category, onChange, onReset }: {
  chain: string
  risk: string
  time: string
  category: string
  onChange: (next: { chain?: string; risk?: string; time?: string; category?: string }) => void
  onReset: () => void
}) {
  return (
    <section className="filter-bar" aria-label="Scanner filters">
      <PillSelect label="Chain" value={chain} options={chains} onChange={(value) => onChange({ chain: value })} />
      <PillSelect label="Risk" value={risk} options={riskLevels} onChange={(value) => onChange({ risk: value })} />
      <PillSelect label="Setup" value={time} options={timeCosts} onChange={(value) => onChange({ time: value })} />
      <PillSelect label="Category" value={category} options={categories} onChange={(value) => onChange({ category: value })} />
      <button className="ghost-button" type="button" onClick={onReset}>Reset scan</button>
    </section>
  )
}

function ScannerGrid({ opportunities, selected, watched, weeklyRange, onSelect, onWatch, onCreateAlert }: {
  opportunities: Opportunity[]
  selected?: Opportunity
  watched: Set<string>
  weeklyRange: (item: Opportunity) => { low: number; high: number }
  onSelect: (id: string) => void
  onWatch: (id: string) => void
  onCreateAlert: () => void
}) {
  const selectedWeekly = selected ? weeklyRange(selected) : { low: 0, high: 0 }
  return (
    <section className="dashboard-grid">
      <section className="market-table-card" id="scanner" aria-labelledby="scanner-title">
        <div className="section-heading">
          <div>
            <h2 id="scanner-title">Yield intelligence feed</h2>
            <p>Ranked by confidence, capital fit, risk, fees, and setup time.</p>
          </div>
          <span>{opportunities.length} matches</span>
        </div>
        {opportunities.length === 0 ? (
          <EmptyState title="No signals matched this scan." copy="Try widening the chain, risk, category, setup time, or search query." />
        ) : (
          <>
            <div className="market-table" role="table" aria-label="Ranked yield opportunities">
              <div className="table-head" role="row">
                <span>#</span><span>Name</span><span>Signal</span><span>Est. weekly</span><span>TVL</span><span>Gas</span><span>Confidence</span><span>Risk</span><span>Setup</span>
              </div>
              {opportunities.map((item) => <OpportunityRow key={item.id} item={item} selected={selected?.id === item.id} weeklyRange={weeklyRange(item)} onSelect={onSelect} />)}
            </div>
            <div className="mobile-cards">
              {opportunities.map((item) => <OpportunityCard key={item.id} item={item} selected={selected?.id === item.id} weeklyRange={weeklyRange(item)} onSelect={onSelect} />)}
            </div>
          </>
        )}
      </section>

      <aside className="side-panel" aria-labelledby="detail-title">
        {selected && (
          <div className="detail-card">
            <div className="detail-topline">
              <span className={`token-logo token-${selected.symbol.toLowerCase()}`}>{selected.symbol.slice(0, 2)}</span>
              <span className={`source-badge ${selected.source.toLowerCase()}`}>{selected.source}</span>
              <button className="watch-button" type="button" onClick={() => onWatch(selected.id)}>
                <Icon name="star" />
                {watched.has(selected.id) ? 'Watching' : 'Watch'}
              </button>
            </div>
            <h2 id="detail-title">{selected.name}</h2>
            <p>{selected.notes}</p>
            <div className="earnings-box">
              <span>Projected weekly range</span>
              <strong>{money(selectedWeekly.low)} - {money(selectedWeekly.high)}</strong>
              <small>Informational estimate only, not a guaranteed return.</small>
            </div>
            <dl className="detail-list">
              <div><dt>Asset</dt><dd>{selected.asset}</dd></div>
              <div><dt>Minimum</dt><dd>{money(selected.minimum)}</dd></div>
              <div><dt>TVL</dt><dd>{selected.tvl}</dd></div>
              <div><dt>Intel score</dt><dd>{selected.confidence}%</dd></div>
            </dl>
            <div className="flag-list">{selected.flags.map((flag) => <span key={flag}>{flag}</span>)}</div>
            <button className="primary-button full-width" type="button" onClick={onCreateAlert}>Create matching alert</button>
            <a className="ghost-button full-width" href={selected.actionUrl} rel="noreferrer">
              {selected.action}<Icon name="arrow" />
            </a>
          </div>
        )}
        <div className="module-card">
          <div className="module-heading"><h2>Live signal watch</h2><a href="#scanner">Open feed</a></div>
          <ol className="trending-list">
            {quickWins.map((win, index) => (
              <li key={win.title}><span>{index + 1}</span><div><strong>{win.title}</strong><small>{win.meta}</small></div><em>{win.change}</em></li>
            ))}
          </ol>
        </div>
      </aside>
    </section>
  )
}

function OpportunityRow({ item, selected, weeklyRange, onSelect }: {
  item: Opportunity
  selected: boolean
  weeklyRange: { low: number; high: number }
  onSelect: (id: string) => void
}) {
  return (
    <button className={`opportunity-row ${selected ? 'selected' : ''}`} type="button" onClick={() => onSelect(item.id)} role="row">
      <span className="rank-cell">{item.rank}</span>
      <AssetCell item={item} />
      <span className="yield-cell"><strong>{item.apy ? `${item.apy.toFixed(1)}%` : 'Task'}</strong><TrendBadge trend={item.trend} value={item.trendValue} /></span>
      <span className="number-cell">{money(weeklyRange.low)} - {money(weeklyRange.high)}</span>
      <span className="number-cell">{item.tvl}</span>
      <span className="number-cell">{item.gas}</span>
      <span><Confidence value={item.confidence} /></span>
      <span><RiskBadge risk={item.risk} /></span>
      <span className="time-cell">{item.time}</span>
    </button>
  )
}

function OpportunityCard({ item, selected, weeklyRange, onSelect }: {
  item: Opportunity
  selected: boolean
  weeklyRange: { low: number; high: number }
  onSelect: (id: string) => void
}) {
  return (
    <button className={`opportunity-card ${selected ? 'selected' : ''}`} type="button" onClick={() => onSelect(item.id)}>
      <div className="opportunity-card-top"><AssetCell item={item} /><RiskBadge risk={item.risk} /></div>
      <div className="opportunity-card-metrics">
        <span>Signal<strong>{item.apy ? `${item.apy.toFixed(1)}%` : 'Task'}</strong></span>
        <span>Weekly<strong>{money(weeklyRange.low)} - {money(weeklyRange.high)}</strong></span>
        <span>TVL<strong>{item.tvl}</strong></span>
        <span>Score<strong>{item.confidence}%</strong></span>
      </div>
    </button>
  )
}

function AssetCell({ item }: { item: Opportunity }) {
  return (
    <span className="asset-cell">
      <span className={`token-logo token-${item.symbol.toLowerCase()}`}>{item.symbol.slice(0, 2)}</span>
      <span><strong>{item.name}</strong><small>{item.platform} - {item.chain} - {item.category} - {item.source}</small></span>
    </span>
  )
}

function PillSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="pill-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

function TrendBadge({ trend, value }: { trend: Opportunity['trend']; value: number }) {
  const prefix = trend === 'down' ? '-' : '+'
  return <small className={`trend ${trend}`}>{trend === 'flat' ? '0.0%' : `${prefix}${value.toFixed(1)}%`}</small>
}

function Confidence({ value }: { value: number }) {
  return <span className="confidence"><span style={{ width: `${value}%` }} /><strong>{value}</strong></span>
}

function RiskBadge({ risk }: { risk: Opportunity['risk'] }) {
  return <span className={`risk-badge ${risk.toLowerCase()}`}>{risk}</span>
}

function Panel({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return <section className="panel-card"><h2>{title}</h2><p>{copy}</p>{children}</section>
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="empty-state"><strong>{title}</strong><span>{copy}</span></div>
}
