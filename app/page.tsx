'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Bell, Crosshair, LineChart, Radio, ShieldCheck } from 'lucide-react'
import { MarketingNav } from '../components/marketing-nav'
import type { Opportunity } from '../lib/types'

const radarRows = [
  { p: 'Lido', c: 'Ethereum', a: 'STETH', apy: '2.36%', score: 96, x: 60, y: 32 },
  { p: 'Aave', c: 'Base', a: 'USDC', apy: '8.40%', score: 88, x: 34, y: 58 },
  { p: 'Jito', c: 'Solana', a: 'SOL', apy: '7.10%', score: 84, x: 70, y: 67 },
  { p: 'Maple', c: 'Ethereum', a: 'USDC', apy: '4.80%', score: 79, x: 42, y: 26 },
]

const steps = [
  { n: '01', icon: Radio, t: 'Scan', b: 'Pull live DeFiLlama yield data and narrow hundreds of pools into a ranked research queue.' },
  { n: '02', icon: Crosshair, t: 'Target', b: 'Set APY, asset, chain, risk, and safety-score rules instead of checking every pool manually.' },
  { n: '03', icon: Bell, t: 'Alert', b: 'Send matching opportunities to Telegram or email when an hourly scan catches your rule.' },
  { n: '04', icon: ShieldCheck, t: 'Research', b: 'Stay non-custodial. QuickYield shows signal and risk context; users still verify before moving funds.' },
]

const riskFactors = [
  { label: 'TVL / liquidity', detail: 'Is there enough market depth to make the yield worth researching?' },
  { label: 'APY stability', detail: 'Does the yield look steady, or did it spike only in the latest feed?' },
  { label: 'Reward quality', detail: 'Is the APY mostly base yield, or heavily driven by incentives?' },
  { label: 'Data completeness', detail: 'How much history and market-feed context is available?' },
]

function RadarPreview() {
  return (
    <div className="qy-radar-panel" aria-label="QuickYield dashboard preview">
      <div className="qy-radar-screen">
        <div className="qy-radar-rings" />
        <div className="qy-radar-cross qy-radar-cross-x" />
        <div className="qy-radar-cross qy-radar-cross-y" />
        <div className="qy-radar-sweep" />
        {radarRows.map((row, index) => (
          <div
            key={row.p}
            className="qy-radar-hit"
            style={{ left: `${row.x}%`, top: `${row.y}%`, animationDelay: `${index * 0.18}s` }}
          >
            <span />
          </div>
        ))}
        <div className="qy-radar-core">
          <span>QY</span>
        </div>
      </div>
      <div className="qy-radar-list">
        <div className="qy-radar-list-head">
          <span>Matched targets</span>
          <strong>Live</strong>
        </div>
        {radarRows.map((row) => (
          <div key={row.p} className="qy-radar-row">
            <div>
              <strong>{row.p}</strong>
              <span>{row.a} / {row.c}</span>
            </div>
            <div>
              <strong>{row.apy}</strong>
              <span>{row.score} safety</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [stats, setStats] = useState({ total: '500+', chains: 'Major', scans: 'Hourly', alerts: 'Rules' })

  useEffect(() => {
    fetch('/api/opportunities?capital=100')
      .then((response) => response.json())
      .then((data: { opportunities?: Opportunity[]; total?: number }) => {
        const opportunities = data.opportunities ?? []
        if (!opportunities.length) return
        const chains = new Set(opportunities.map((item) => item.chain)).size
        setStats({
          total: data.total && data.total >= 500 ? `${data.total.toLocaleString()}+` : '500+',
          chains: chains > 1 ? `${chains}+` : 'Major',
          scans: 'Hourly',
          alerts: 'Instant',
        })
      })
      .catch(() => {})
  }, [])

  return (
    <main>
      <MarketingNav />

      <section className="qy-hero qy-radar-hero">
        <div className="qy-radar-bg" />
        <div className="qy-data-rail qy-data-rail-left" aria-hidden="true">
          {['ETH 2.36%', 'USDC 8.40%', 'SOL 7.10%', 'TVL $1.2B', 'SCAN OK', 'RISK LOW'].map((item) => <span key={item}>{item}</span>)}
        </div>
        <div className="qy-data-rail qy-data-rail-right" aria-hidden="true">
          {['BASE LIVE', 'ARB LIVE', 'EMAIL OK', 'TG READY', 'APY +0.2', '500+ POOLS'].map((item) => <span key={item}>{item}</span>)}
        </div>
        <div className="qy-container qy-hero-body qy-radar-hero-body">
          <div className="qy-fade-up qy-hero-copy">
            <h1 className="qy-h1">Find Better Yield Opportunities. Before Everyone Else.</h1>
            <p className="qy-hero-sub">
              QuickYield scans 500+ DeFi yield pools across major chains, lets users set personal rules, and sends Telegram or email alerts when matches appear.
            </p>
            <div className="qy-hero-actions">
              <Link href="/sign-up" className="qy-btn qy-btn-primary qy-btn-glow qy-btn-lg">
                Start tracking <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <a href="#how" className="qy-btn qy-btn-secondary qy-btn-lg">See the workflow</a>
            </div>
            <div className="qy-hero-proof">
              <span>No wallet connection</span>
              <span>No custody</span>
              <span>Research only</span>
              <span>Telegram + email alerts</span>
            </div>
          </div>

          <div className="qy-fade-up-delay-2 qy-radar-stage">
            <RadarPreview />
          </div>
        </div>
      </section>

      <section className="qy-stats">
        <div className="qy-stats-grid">
          {[
            { l: 'Tracked pools', v: stats.total },
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

      <section id="how" className="qy-section">
        <div className="qy-container">
          <div className="qy-section-head qy-section-head-wide">
            <h2 className="qy-h2">DeFiLlama shows everything. QuickYield shows what matters to you.</h2>
            <p>QuickYield turns raw yield data into a repeatable research loop: scan, filter, risk-adjust, target, notify.</p>
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

      <section id="features" className="qy-section" style={{ paddingTop: 0 }}>
        <div className="qy-container">
          <div className="qy-section-head qy-section-head-wide">
            <h2 className="qy-h2">Personalized yield intelligence, not another data dump.</h2>
          </div>
          <div className="qy-bento">
            <div className="qy-bento-card qy-bento-hero qy-noise qy-fade-up">
              <h3>Screen the market without pretending yield is risk-free.</h3>
              <p>Sort by APY, TVL, 24h movement, risk tier, chain, and safety score. Every pool opens into research context that explains why it ranked.</p>
              <div className="qy-bento-mini">
                <div className="qy-bento-mini-head">Radar shortlist</div>
                {[
                  { p: 'Aave', c: 'Base', a: 8.4 },
                  { p: 'Jito', c: 'Solana', a: 7.1 },
                  { p: 'Maple', c: 'Ethereum', a: 4.8 },
                  { p: 'Lido', c: 'Arbitrum', a: 3.9 },
                  { p: 'Kelp', c: 'Ethereum', a: 2.86 },
                ].map((row) => (
                  <div key={row.p} className="qy-bento-mini-row">
                    <strong>{row.p}</strong>
                    <span>{row.c}</span>
                    <span className="qy-mono">{row.a.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="qy-bento-card qy-fade-up" style={{ animationDelay: '0.08s' }}>
              <Bell className="qy-icon" />
              <h3>Rules that sound like your workflow</h3>
              <p>Create targets such as USDC APY above 15% with risk at Medium or lower, then receive matches through Telegram or email.</p>
            </div>

            <div className="qy-bento-card green qy-fade-up" style={{ animationDelay: '0.16s' }}>
              <ShieldCheck className="qy-icon" />
              <h3>Research only, by design</h3>
              <p>No wallet connection, no custody, no execution. QuickYield finds signal; users verify before moving funds.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="qy-section" style={{ paddingTop: 0 }}>
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

      <section className="qy-section" style={{ paddingTop: 0 }}>
        <div className="qy-container">
          <div className="qy-section-head qy-section-head-wide">
            <h2 className="qy-h2">What a user sees when a target hits.</h2>
          </div>
          <div className="qy-alert-demo">
            <div className="qy-phone qy-fade-up">
              <div className="qy-phone-top">QuickYield alert</div>
              <div className="qy-phone-bubble">
                <strong>STETH yield pool</strong>
                <span>Lido on Ethereum</span>
                <span>APY: 2.36% | Safety score: 96</span>
                <span>Rule: STETH above 2%</span>
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

      <section className="qy-section" style={{ paddingTop: 0 }}>
        <div className="qy-container">
          <div className="qy-cta qy-noise qy-fade-up">
            <div className="qy-cta-glow" />
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
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink)' }}>QuickYield</div>
              <p style={{ marginTop: 8, color: 'var(--ink-dim)', fontSize: 12, maxWidth: 280 }}>
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
              <h4>Resources</h4>
              <ul>
                <li>500+ pool scanner</li>
                <li>Telegram and email alerts</li>
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
