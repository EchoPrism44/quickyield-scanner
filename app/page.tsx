'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Bell, Eye, LineChart, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { MarketingNav } from '../components/marketing-nav'
import type { Opportunity } from '../lib/types'

const previewRows = [
  { p: 'Aave', c: 'Base', a: 'USDC', apy: '8.40%', tvl: '$146M', screened: true },
  { p: 'Jito', c: 'Solana', a: 'SOL', apy: '7.10%', tvl: '$1.7B', screened: true },
  { p: 'Maple', c: 'Ethereum', a: 'USDC', apy: '4.80%', tvl: '$3.3B', screened: true },
  { p: 'Lido', c: 'Arbitrum', a: 'ETH', apy: '3.90%', tvl: '$35B', screened: true },
  { p: 'Binance Earn', c: 'Exchange', a: 'USDT', apy: '5.30%', tvl: 'N/A', screened: false },
]

const steps = [
  { n: '01', icon: LineChart, t: 'Track the screened market', b: 'QuickYield scans up to 500 live pools, ranks the universe, and keeps the research workflow inside the terminal.' },
  { n: '02', icon: Eye, t: 'Open pool research pages', b: 'Each pool gets a dedicated page with stored history, method notes, related pools, and alert actions.' },
  { n: '03', icon: Bell, t: 'Set alerts that matter', b: 'Watch specific pools, set thresholds, and get hourly-scan notifications in email or Telegram.' },
  { n: '04', icon: Zap, t: 'Move with context', b: "QuickYield stays in research mode. We never touch your wallet or move funds for you." },
]

export default function HomePage() {
  const [stats, setStats] = useState({ total: '0', tvl: '$0', screened: '0', avg: '0.0%' })

  useEffect(() => {
    fetch('/api/opportunities?capital=100')
      .then((response) => response.json())
      .then((data: { opportunities?: Opportunity[] }) => {
        const opportunities = data.opportunities ?? []
        if (!opportunities.length) return
        const tvl = opportunities.reduce((sum, item) => sum + (item.tvlUsd || 0), 0)
        const screened = opportunities.filter((item) => item.risk === 'Low').length
        const avg = opportunities.reduce((sum, item) => sum + (item.apy || 0), 0) / opportunities.length
        setStats({
          total: opportunities.length.toString(),
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

      <section className="qy-hero">
        <div className="qy-hero-bg-grid qy-grid-bg qy-grid-bg-fade" />
        <div className="qy-hero-glow" />
        <div className="qy-container qy-hero-body">
          <div className="qy-fade-up">
            <div className="qy-pill">
              <span className="qy-pill-dot" />
              <span className="qy-mono">Live data / ranked shortlist / private dashboard</span>
            </div>
            <h1 className="qy-h1">
              A private terminal for <em>screened</em><br />DeFi yield research.
            </h1>
            <p className="qy-hero-sub">
              QuickYield scans up to 500 live yield pools, ranks the market, stores hourly snapshots, and helps you monitor the opportunities worth checking first. No wallet connection. No custody.
            </p>
            <div className="qy-hero-actions">
              <Link href="/dashboard" className="qy-btn qy-btn-primary qy-btn-glow qy-btn-lg">
                Open the terminal <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <a href="#how" className="qy-btn qy-btn-secondary qy-btn-lg">
                See how it works
              </a>
            </div>
            <div className="qy-hero-protocols">
              <span>Aave</span><span>Jito</span><span>Maple</span><span>Lido</span><span>Pendle</span>
            </div>
          </div>

          <div className="qy-fade-up-delay-2 qy-preview-wrap">
            <div className="qy-preview-glow" />
            <div className="qy-preview qy-noise">
              <div className="qy-preview-bar">
                <span className="qy-preview-dot" /><span className="qy-preview-dot" /><span className="qy-preview-dot" />
                <div className="qy-preview-url">
                  <span className="qy-pill-dot" />
                  sample-market-view
                </div>
              </div>
              <div className="qy-preview-grid">
                <div className="qy-preview-side">
                  {['Markets', 'Watchlist', 'Alerts', 'Settings'].map((item, index) => (
                    <div key={item} className={`qy-preview-side-item${index === 0 ? ' active' : ''}`}>{item}</div>
                  ))}
                </div>
                <div>
                  <div className="qy-preview-table-head">
                    <div>
                      <div className="qy-overline">Sample market view</div>
                      <div style={{ marginTop: 2, fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink)' }}>Screened yield table</div>
                    </div>
                    <span className="qy-pill" style={{ margin: 0, padding: '4px 12px' }}>Private</span>
                  </div>
                  {previewRows.map((row, index) => (
                    <div key={row.p} className="qy-preview-row qy-row-slide" style={{ animationDelay: `${0.6 + index * 0.08}s` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="qy-preview-icon" />
                        <div>
                          <strong>{row.p}</strong>
                          <div className="qy-mono" style={{ marginTop: 2 }}>{row.c} / {row.a}</div>
                        </div>
                      </div>
                      <div>{row.screened ? <span className="qy-tag-safe">Screened</span> : <span className="qy-tag-mini qy-risk-medium">Review</span>}</div>
                      <div className="qy-mono" style={{ textAlign: 'right' }}>{row.tvl}</div>
                      <div className="qy-num bold">{row.apy}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
          <div className="qy-section-head">
            <span className="qy-overline qy-overline-signal">How it works</span>
            <h2 className="qy-h2">From noisy market to cleaner shortlist.</h2>
            <p>QuickYield narrows the market, stores history, and helps you move from browsing to research.</p>
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
          <div className="qy-section-head">
            <span className="qy-overline qy-overline-signal">Features</span>
            <h2 className="qy-h2">Closer to a terminal than a hype page.</h2>
          </div>
          <div className="qy-bento">
            <div className="qy-bento-card qy-bento-hero qy-noise qy-fade-up">
              <span className="qy-overline qy-overline-signal">Ranked market</span>
              <h3>Live market data, explicit scoring, and a denser table.</h3>
              <p>Sort by APY, TVL, volatility, or QuickYield score. Lower-risk screens are called out, and every pool opens into an internal research page.</p>
              <div className="qy-bento-mini">
                <div className="qy-bento-mini-head">Tracked market / sample</div>
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
              <h3>Threshold alerts</h3>
              <p>Email and Telegram alerts tied to the pools you follow, deduped against hourly scan runs.</p>
            </div>

            <div className="qy-bento-card green qy-fade-up" style={{ animationDelay: '0.16s' }}>
              <ShieldCheck className="qy-icon" />
              <h3>Research only</h3>
              <p>We do not connect wallets, hold funds, or pretend a score replaces protocol due diligence.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="qy-section" style={{ paddingTop: 0 }}>
        <div className="qy-container">
          <div className="qy-section-head">
            <span className="qy-overline qy-overline-signal">Direction</span>
            <h2 className="qy-h2">Built for users who want signal without fake certainty.</h2>
          </div>
          <div className="qy-testimonials-grid">
            <div className="qy-testi qy-fade-up">
              <Sparkles className="qy-testi-icon" fill="currentColor" />
              <blockquote>"I do not need a thousand noisy pools. I need the few worth checking first, with history and alerts right there."</blockquote>
              <p style={{ marginTop: 8, color: 'var(--ink-dim)', fontSize: 13 }}>Terminal-first product direction</p>
            </div>
          </div>
        </div>
      </section>

      <section className="qy-section" style={{ paddingTop: 0 }}>
        <div className="qy-container">
          <div className="qy-cta qy-noise qy-fade-up">
            <div className="qy-cta-glow" />
            <h2 className="qy-h2">Stop guessing which pool deserves attention.<br />Start with a cleaner market.</h2>
            <p>Private dashboard. Hourly snapshots. Internal pool pages. Research only.</p>
            <Link href="/dashboard" className="qy-btn qy-btn-primary qy-btn-lg qy-btn-glow qy-cta-btn">
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
                <li><Link href="/dashboard">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4>Resources</h4>
              <ul>
                <li>Live market-feed coverage</li>
                <li><Link href="/analytics">Market overview</Link></li>
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
