'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bell, Calculator, CheckCircle2, LineChart, Radio, ShieldCheck, Target } from 'lucide-react'
import { BrandLogo } from '../components/brand-logo'
import { MarketingNav } from '../components/marketing-nav'
import type { Opportunity } from '../lib/types'

const fallbackOpportunities: Opportunity[] = [
  {
    id: 'landing-lido-steth',
    rank: 1,
    name: 'STETH yield pool',
    platform: 'Lido',
    category: 'ETH staking',
    chain: 'Ethereum',
    asset: 'STETH',
    symbol: 'STETH',
    apy: 2.36,
    trend: 'flat',
    trendValue: 0.08,
    risk: 'Low',
    minimum: 100,
    time: 'Ongoing',
    tvl: '$31.2B',
    tvlUsd: 31200000000,
    gas: 'Medium',
    confidence: 96,
    dailyLow: 2.22,
    dailyHigh: 2.46,
    action: 'View details',
    actionUrl: 'https://lido.fi/',
    officialUrl: 'https://lido.fi/',
    sourceUrl: 'https://defillama.com/yields',
    protocolSlug: 'lido',
    source: 'Curated',
    notes: 'High TVL and stable APY.',
    rankReason: 'High TVL and stable APY',
    flags: ['High TVL', 'Stable APY'],
    lastSeenAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    volatility: 8,
    dataCompleteness: 94,
    scoreBreakdown: { liquidity: 98, stability: 92, sustainability: 86, completeness: 94 },
  },
  {
    id: 'landing-aave-usdc',
    rank: 2,
    name: 'USDC lending market',
    platform: 'Aave',
    category: 'Stablecoin lending',
    chain: 'Base',
    asset: 'USDC',
    symbol: 'USDC',
    apy: 8.4,
    trend: 'up',
    trendValue: 0.34,
    risk: 'Medium',
    minimum: 100,
    time: '15 min',
    tvl: '$487M',
    tvlUsd: 487000000,
    gas: 'Low',
    confidence: 88,
    dailyLow: 7.88,
    dailyHigh: 8.62,
    action: 'View details',
    actionUrl: 'https://app.aave.com/',
    officialUrl: 'https://aave.com/',
    sourceUrl: 'https://defillama.com/yields',
    protocolSlug: 'aave',
    source: 'Curated',
    notes: 'Higher APY, review reward quality.',
    rankReason: 'Higher APY, review reward quality',
    flags: ['Stablecoin', 'Review rewards'],
    lastSeenAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    volatility: 22,
    dataCompleteness: 90,
    scoreBreakdown: { liquidity: 86, stability: 78, sustainability: 72, completeness: 90 },
  },
  {
    id: 'landing-jito-sol',
    rank: 3,
    name: 'SOL staking yield',
    platform: 'Jito',
    category: 'Solana yield',
    chain: 'Solana',
    asset: 'SOL',
    symbol: 'SOL',
    apy: 7.1,
    trend: 'up',
    trendValue: 0.21,
    risk: 'Medium',
    minimum: 50,
    time: 'Ongoing',
    tvl: '$1.5B',
    tvlUsd: 1500000000,
    gas: 'Low',
    confidence: 84,
    dailyLow: 6.81,
    dailyHigh: 7.24,
    action: 'View details',
    actionUrl: 'https://www.jito.network/',
    officialUrl: 'https://www.jito.network/',
    sourceUrl: 'https://defillama.com/yields',
    protocolSlug: 'jito',
    source: 'Curated',
    notes: 'Strong TVL with moving APY.',
    rankReason: 'Strong TVL with moving APY',
    flags: ['Liquid staking', 'Moving APY'],
    lastSeenAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    volatility: 18,
    dataCompleteness: 86,
    scoreBreakdown: { liquidity: 88, stability: 74, sustainability: 78, completeness: 86 },
  },
]

const proofItems = ['No wallet connection', 'No custody', 'Research only', 'Telegram + email alerts']
const railLeft = ['ETH 2.36%', 'USDC 8.40%', 'SOL 7.10%', 'TVL WATCH', 'SCAN OK', 'RISK CONTEXT']
const railRight = ['BASE LIVE', 'ARB LIVE', 'EMAIL READY', 'TG READY', 'APY +0.2', '500+ POOLS']

const steps = [
  { n: '01', icon: Radio, t: 'Scan', b: 'Index hundreds of DeFi yield pools and keep the market feed moving in the background.' },
  { n: '02', icon: Target, t: 'Set rules', b: 'Describe the opportunity you want: asset, APY threshold, chain, max risk, and safety score.' },
  { n: '03', icon: Bell, t: 'Get alerted', b: 'QuickYield sends a Telegram or email alert only when a pool matches your rule.' },
  { n: '04', icon: ShieldCheck, t: 'Research', b: 'Open the pool details, review risk context, and verify before taking any action elsewhere.' },
]

const riskFactors = [
  { label: 'TVL / liquidity', detail: 'Is there enough market depth to make the yield worth researching?' },
  { label: 'APY stability', detail: 'Does the yield look steady, or did it spike only in the latest feed?' },
  { label: 'Reward sustainability', detail: 'Is the APY mostly base yield, or heavily driven by incentives?' },
  { label: 'Data completeness', detail: 'How much history and market-feed context is available?' },
]

function formatTvl(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function LandingFlowBackground() {
  return (
    <div className="qy-terminal-flow" aria-hidden="true">
      <svg viewBox="0 0 1800 1000" preserveAspectRatio="none">
        <path className="qy-flow-line qy-flow-orange" d="M-120 190 L410 190 L720 500 L1920 500" />
        <path className="qy-flow-line qy-flow-green" d="M-120 450 L600 450 L850 210 L1920 210" />
        <path className="qy-flow-line qy-flow-blue" d="M-120 790 L230 790 L340 900 L1920 900" />
        <circle className="qy-flow-node qy-flow-node-a" cx="410" cy="190" r="6" />
        <circle className="qy-flow-node qy-flow-node-b" cx="720" cy="500" r="6" />
        <circle className="qy-flow-node qy-flow-node-c" cx="850" cy="210" r="6" />
      </svg>
      <span className="qy-particle qy-particle-a" />
      <span className="qy-particle qy-particle-b" />
      <span className="qy-particle qy-particle-c" />
    </div>
  )
}

function ScannerPreview({ opportunities }: { opportunities: Opportunity[] }) {
  const rows = opportunities.slice(0, 4)
  return (
    <div className="qy-scanner-preview" aria-label="QuickYield scanner preview">
      <div className="qy-scanner-top">
        <span className="qy-pill-dot" />
        <span>Market feed synced</span>
        <strong>500+ pools</strong>
      </div>
      <div className="qy-scanner-terminal">
        {rows.map((item, index) => (
          <div key={item.id} className="qy-scanner-row" style={{ animationDelay: `${index * 0.11}s` }}>
            <div>
              <strong>{item.platform}</strong>
              <span>{item.asset} / {item.chain}</span>
            </div>
            <div>
              <strong>{item.apy.toFixed(2)}%</strong>
              <span>{item.rankReason || item.notes || 'Ranked for review'}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="qy-signal-stream">
        {[
          'Pool indexed',
          'Risk context generated',
          'Alert channel ready',
          'No custody mode',
        ].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  )
}

function YieldEstimator({ opportunities }: { opportunities: Opportunity[] }) {
  const [selectedId, setSelectedId] = useState(opportunities[0]?.id ?? '')
  const [capital, setCapital] = useState(1000)
  const [days, setDays] = useState(30)
  const selected = opportunities.find((item) => item.id === selectedId) ?? opportunities[0]
  const selectedValue = selected?.id ?? ''
  const estimate = selected ? (capital * selected.apy * (days / 365)) / 100 : 0

  return (
    <div className="qy-estimator">
      <div className="qy-estimator-copy">
        <Calculator className="qy-icon" />
        <h2 className="qy-h2">Estimate the signal before you chase it.</h2>
        <p>
          Use the live opportunity feed to compare APY, TVL, and risk context. Estimates are for research only and are not financial advice.
        </p>
      </div>
      <div className="qy-estimator-panel">
        <label>
          <span>Pool</span>
          <select value={selectedValue} onChange={(event) => setSelectedId(event.target.value)}>
            {opportunities.slice(0, 8).map((item) => (
              <option key={item.id} value={item.id}>{item.platform} {item.asset} / {item.chain}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Capital for estimate</span>
          <input type="range" min="100" max="10000" step="100" value={capital} onChange={(event) => setCapital(Number(event.target.value))} />
        </label>
        <label>
          <span>Timeframe</span>
          <div className="qy-estimator-segments" role="group" aria-label="Estimate timeframe">
            {[30, 180, 365].map((value) => (
              <button
                key={value}
                type="button"
                className={days === value ? 'active' : ''}
                aria-pressed={days === value}
                onClick={() => setDays(value)}
              >
                {value === 365 ? '1Y' : `${value}D`}
              </button>
            ))}
          </div>
        </label>
        <div className="qy-estimator-result">
          <span>Estimated research yield</span>
          <strong>${estimate.toFixed(2)}</strong>
          <small>{selected ? `${selected.apy.toFixed(2)}% APY / ${formatTvl(selected.tvlUsd)} TVL / ${selected.risk} risk` : 'Waiting for market data'}</small>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(fallbackOpportunities)
  const [stats, setStats] = useState({ total: '500+', chains: 'Major', scans: 'Hourly', alerts: 'Ready' })

  useEffect(() => {
    fetch('/api/opportunities?capital=100&pageSize=8')
      .then((response) => response.json())
      .then((data: { opportunities?: Opportunity[]; total?: number }) => {
        const items = data.opportunities ?? []
        if (!items.length) return
        const chains = new Set(items.map((item) => item.chain)).size
        setOpportunities(items)
        setStats({
          total: data.total && data.total >= 500 ? `${data.total.toLocaleString()}+` : '500+',
          chains: chains > 1 ? `${chains}+` : 'Major',
          scans: 'Hourly',
          alerts: 'Telegram + email',
        })
      })
      .catch(() => {})
  }, [])

  const topOpportunity = useMemo(() => opportunities[0] ?? fallbackOpportunities[0], [opportunities])

  return (
    <main>
      <MarketingNav />

      <section className="qy-hero qy-terminal-hero">
        <LandingFlowBackground />
        <div className="qy-data-rail qy-data-rail-left" aria-hidden="true">
          {[...railLeft, ...railLeft].map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
        </div>
        <div className="qy-data-rail qy-data-rail-right" aria-hidden="true">
          {[...railRight, ...railRight].map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
        </div>

        <div className="qy-container qy-terminal-hero-body">
          <div className="qy-live-ticker" aria-label="Live scanner preview">
            <span className="qy-pill-dot" />
            <span>{topOpportunity.platform} {topOpportunity.asset}</span>
            <strong>{topOpportunity.apy.toFixed(2)}% APY</strong>
            <span>{topOpportunity.rankReason || 'Matched for review'}</span>
          </div>

          <div className="qy-terminal-logo-wrap qy-fade-up">
            <BrandLogo className="qy-logo-hero qy-logo-animated" label="QuickYield" />
          </div>

          <div className="qy-terminal-hero-copy qy-fade-up-delay-2">
            <h1 className="qy-h1">Find Better Yield Opportunities. Before Everyone Else.</h1>
            <p className="qy-hero-sub">
              QuickYield scans 500+ DeFi yield pools across major chains, lets users set personal rules, and sends Telegram or email alerts when matches appear.
            </p>
            <p className="qy-terminal-diff">
              DeFiLlama shows everything. QuickYield shows what matters to you.
            </p>
            <div className="qy-hero-actions">
              <Link href="/sign-up" className="qy-btn qy-btn-primary qy-btn-glow qy-btn-lg">
                Start tracking <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link href="/sign-in" className="qy-btn qy-btn-secondary qy-btn-lg">View dashboard</Link>
            </div>
            <div className="qy-hero-proof">
              {proofItems.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>

          <ScannerPreview opportunities={opportunities} />
        </div>
      </section>

      <section className="qy-stats qy-terminal-stats">
        <div className="qy-stats-grid">
          {[
            { l: 'Pools scanned', v: stats.total },
            { l: 'Chains covered', v: stats.chains },
            { l: 'Scan cadence', v: stats.scans },
            { l: 'Alert delivery', v: stats.alerts },
          ].map((stat, index) => (
            <div key={stat.l} className="qy-stats-cell qy-fade-up" style={{ animationDelay: `${index * 0.08}s` }}>
              <div className="qy-stats-value">{stat.v}</div>
              <div className="qy-overline" style={{ marginTop: 4 }}>{stat.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="qy-section qy-section-tight">
        <div className="qy-container">
          <div className="qy-section-head qy-section-head-wide">
            <h2 className="qy-h2">Personalized yield intelligence, not another data dump.</h2>
            <p>QuickYield turns raw pool data into a focused loop: discover safer opportunities, understand the reason, and create alerts in plain language.</p>
          </div>
          <div className="qy-opportunity-preview">
            {opportunities.slice(0, 3).map((item) => (
              <article key={item.id} className="qy-opportunity-card">
                <div>
                  <span className="qy-overline">{item.chain}</span>
                  <h3>{item.platform}</h3>
                  <p>{item.asset} / {item.category}</p>
                </div>
                <div className="qy-opportunity-metrics">
                  <strong>{item.apy.toFixed(2)}%</strong>
                  <span>APY</span>
                </div>
                <div className="qy-opportunity-foot">
                  <span>{formatTvl(item.tvlUsd)} TVL</span>
                  <span>{item.risk} risk</span>
                  <span>{item.confidence} safety</span>
                </div>
                <p className="qy-opportunity-reason">{item.rankReason || item.notes || 'Ranked for research review'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="qy-section qy-section-tight">
        <div className="qy-container">
          <YieldEstimator opportunities={opportunities} />
        </div>
      </section>

      <section id="how" className="qy-section qy-section-tight">
        <div className="qy-container">
          <div className="qy-section-head qy-section-head-wide">
            <h2 className="qy-h2">From market noise to your alert rule.</h2>
          </div>
          <div className="qy-how-grid">
            {steps.map((step, index) => (
              <div key={step.n} className="qy-how-step qy-fade-up" style={{ animationDelay: `${index * 0.08}s` }}>
                <div className="qy-how-step-top">
                  <span className="qy-how-step-num">{step.n}</span>
                  <step.icon className="qy-how-step-icon" />
                </div>
                <h3>{step.t}</h3>
                <p>{step.b}</p>
                <span className="qy-how-underline" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="qy-section qy-section-tight">
        <div className="qy-container">
          <div className="qy-section-head qy-section-head-wide">
            <h2 className="qy-h2">Risk context before action.</h2>
            <p>QuickYield explains the signal with transparent factors from available market data. It does not pretend to know audit status or protocol age unless reliable data is present.</p>
          </div>
          <div className="qy-risk-grid">
            {riskFactors.map((factor) => (
              <article key={factor.label} className="qy-risk-card">
                <span className="qy-overline">{factor.label}</span>
                <p>{factor.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="qy-section qy-section-tight">
        <div className="qy-container">
          <div className="qy-alert-demo">
            <div className="qy-phone qy-fade-up">
              <div className="qy-phone-top">QuickYield alert</div>
              <div className="qy-phone-bubble">
                <strong>{topOpportunity.asset} yield pool</strong>
                <span>{topOpportunity.platform} on {topOpportunity.chain}</span>
                <span>APY: {topOpportunity.apy.toFixed(2)}% | Safety score: {topOpportunity.confidence}</span>
                <span>Rule: {topOpportunity.asset} above 2%</span>
              </div>
            </div>
            <div className="qy-alert-demo-copy qy-fade-up-delay-2">
              <LineChart className="qy-icon" />
              <h3>Fast enough to feel alive. Calm enough to trust.</h3>
              <p>Alerts are short, specific, and linked back to the research page. No fake urgency. No trade button. Just the signal and the context.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="qy-section qy-section-tight">
        <div className="qy-container">
          <div className="qy-cta qy-noise qy-fade-up">
            <div className="qy-cta-glow" />
            <CheckCircle2 className="qy-cta-icon" />
            <h2 className="qy-h2">Launch with a sharper signal.</h2>
            <p>500+ pool scanner. Personalized alerts. Transparent risk context. Research only.</p>
            <Link href="/sign-up" className="qy-btn qy-btn-primary qy-btn-lg qy-btn-glow qy-cta-btn">
              Start tracking <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="qy-footer">
        <div className="qy-container">
          <div className="qy-footer-grid">
            <div>
              <BrandLogo />
              <p style={{ marginTop: 12, color: 'var(--ink-dim)', fontSize: 12, maxWidth: 280 }}>
                Research and alerting for DeFi yields. Not financial advice. No custody. Always verify with the protocol before moving funds.
              </p>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how">How it works</a></li>
                <li><Link href="/sign-in">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4>Alerts</h4>
              <ul>
                <li>Telegram alerts</li>
                <li>Email alerts</li>
                <li>Personal rules</li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li>Informational only</li>
                <li>No financial advice</li>
                <li>No custody of funds</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="qy-footer-bottom">(c) 2026 QuickYield / Signal over noise</div>
      </footer>
    </main>
  )
}
