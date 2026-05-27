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
  { n: '01', icon: Radio, t: 'Scan', b: 'Pull live DeFiLlama yield data and narrow the universe to pools worth a closer look.' },
  { n: '02', icon: Crosshair, t: 'Target', b: 'Set exact APY, asset, chain, risk, and confidence rules instead of watching everything.' },
  { n: '03', icon: Bell, t: 'Alert', b: 'Send matching opportunities to Telegram or email when the hourly scan catches them.' },
  { n: '04', icon: ShieldCheck, t: 'Research', b: 'Stay non-custodial. QuickYield shows signal; users still verify before moving funds.' },
]

function RadarPreview() {
  return (
    <div className="qy-radar-panel" aria-label="QuickYield radar preview">
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
              <span>{row.score} score</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [stats, setStats] = useState({ total: '1,500+', tvl: 'Live', screened: 'Live', avg: 'Live' })

  useEffect(() => {
    fetch('/api/opportunities?capital=100')
      .then((response) => response.json())
      .then((data: { opportunities?: Opportunity[]; total?: number }) => {
        const opportunities = data.opportunities ?? []
        if (!opportunities.length) return
        const tvl = opportunities.reduce((sum, item) => sum + (item.tvlUsd || 0), 0)
        const screened = opportunities.filter((item) => item.risk === 'Low').length
        const avg = opportunities.reduce((sum, item) => sum + (item.apy || 0), 0) / opportunities.length
        setStats({
          total: data.total ? data.total.toLocaleString() : opportunities.length.toString(),
          tvl: tvl >= 1e9 ? `$${(tvl / 1e9).toFixed(1)}B` : `$${(tvl / 1e6).toFixed(0)}M`,
          screened: screened.toString(),
          avg: `${avg.toFixed(1)}%`,
        })
      })
      .catch(() => {})
  }, [])

  return (
    <main>
      <MarketingNav />

      <section className="qy-hero qy-radar-hero">
        <div className="qy-radar-bg" />
        <div className="qy-container qy-hero-body qy-radar-hero-body">
          <div className="qy-fade-up qy-hero-copy">
            <h1 className="qy-h1">Find the yield worth checking.</h1>
            <p className="qy-hero-sub">
              QuickYield is a private radar for DeFi yield research. Scan live pools, set target rules, and get Telegram alerts when a cleaner opportunity appears.

            </p>
            <div className="qy-hero-actions">
              <Link href="/sign-up" className="qy-btn qy-btn-primary qy-btn-glow qy-btn-lg">
                Open QuickYield <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <a href="#how" className="qy-btn qy-btn-secondary qy-btn-lg">See the radar</a>
            </div>
            <div className="qy-hero-proof">
              <span>No wallet connection</span>
              <span>Telegram alerts</span>
              <span>Research only</span>
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
            { l: 'Live universe', v: stats.total },
            { l: 'Tracked TVL', v: stats.tvl },
            { l: 'Screened pools', v: stats.screened },
            { l: 'Avg APY', v: stats.avg },
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
            <h2 className="qy-h2">A cleaner path from market noise to a target alert.</h2>
            <p>Most yield pages show endless APY rows. QuickYield turns that into a repeatable research loop: scan, filter, target, notify.</p>
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
            <h2 className="qy-h2">Built like a terminal, explained like a product.</h2>
          </div>
          <div className="qy-bento">
            <div className="qy-bento-card qy-bento-hero qy-noise qy-fade-up">
              <h3>Screen the market without pretending yield is risk-free.</h3>
              <p>Sort by APY, TVL, volatility, or QuickYield score. Lower-risk screens are called out, and every pool opens into an internal research page.</p>
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
              <h3>Real target rules</h3>
              <p>Users choose APY, asset, chain, category, risk, and confidence before alerts go out.</p>
            </div>

            <div className="qy-bento-card green qy-fade-up" style={{ animationDelay: '0.16s' }}>
              <ShieldCheck className="qy-icon" />
              <h3>No custody story</h3>
              <p>We do not connect wallets, hold funds, or pretend a score replaces protocol due diligence.</p>
            </div>
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
                <span>APY: 2.36% | Confidence: 96%</span>
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
            <p>Private dashboard. Radar-style scanning. Target alerts. Research only.</p>
            <Link href="/sign-up" className="qy-btn qy-btn-primary qy-btn-lg qy-btn-glow qy-cta-btn">
              Get started <ArrowRight size={16} strokeWidth={2.5} />
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
                <li>1500+ pool scanner</li>
                <li><Link href="/sign-in">Market overview</Link></li>
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
        <div className="qy-footer-bottom">© 2026 QuickYield / Built for clarity in DeFi</div>
      </footer>
    </main>
  )
}
