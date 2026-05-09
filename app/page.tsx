'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowRight, Bell, LineChart, Eye, Zap, ShieldCheck, Sparkles } from 'lucide-react'
import { MarketingNav } from '../components/marketing-nav'
import type { Opportunity } from '../lib/types'

const previewRows = [
  { p: 'Aave v3', c: 'Arbitrum', a: 'USDC', apy: '8.42%', tvl: '$930M', safe: true },
  { p: 'Compound v3', c: 'Ethereum', a: 'USDT', apy: '6.18%', tvl: '$610M', safe: true },
  { p: 'Morpho', c: 'Base', a: 'DAI', apy: '9.34%', tvl: '$480M', safe: true },
  { p: 'Lido', c: 'Ethereum', a: 'stETH', apy: '4.21%', tvl: '$21B', safe: true },
  { p: 'Curve', c: 'Polygon', a: 'USDC', apy: '7.55%', tvl: '$180M', safe: true },
]

const steps = [
  { n: '01', icon: LineChart, t: 'Scan opportunities', b: 'Live yields from 30+ protocols across 20+ chains, curated and ranked. Beginner-safe routes are clearly tagged.' },
  { n: '02', icon: Eye, t: 'Build a watchlist', b: 'Save the pools you care about. We track them every hour and surface meaningful changes — no noise.' },
  { n: '03', icon: Bell, t: 'Set smart alerts', b: 'Notify me if Aave/USDC drops below 6% or Pendle/sUSDe rises above 12%. Email lands in seconds.' },
  { n: '04', icon: Zap, t: 'Act with confidence', b: "Click the source link to deposit on the protocol's official site. We never touch your funds." },
]

export default function HomePage() {
  const [stats, setStats] = useState({ total: '500', tvl: '$80B', safe: '120', avg: '6.2%' })

  useEffect(() => {
    fetch('/api/opportunities?capital=100')
      .then((r) => r.json())
      .then((d: { opportunities?: Opportunity[] }) => {
        const ops = d.opportunities ?? []
        if (!ops.length) return
        const tvl = ops.reduce((s: number, o: Opportunity) => s + (o.tvlUsd || 0), 0)
        const safe = ops.filter((o: Opportunity) => o.risk === 'Low').length
        const avg = ops.reduce((s: number, o: Opportunity) => s + (o.apy || 0), 0) / ops.length
        setStats({
          total: ops.length.toString(),
          tvl: tvl >= 1e9 ? `$${(tvl / 1e9).toFixed(1)}B` : `$${(tvl / 1e6).toFixed(0)}M`,
          safe: safe.toString(),
          avg: `${avg.toFixed(1)}%`,
        })
      })
      .catch(() => {})
  }, [])

  return (
    <main>
      <MarketingNav />

      {/* HERO */}
      <section className="qy-hero">
        <div className="qy-hero-bg-grid qy-grid-bg qy-grid-bg-fade" />
        <div className="qy-hero-glow" />
        <div className="qy-container qy-hero-body">
          <div className="qy-fade-up">
            <div className="qy-pill">
              <span className="qy-pill-dot" />
              <span className="qy-mono">Live yields · email alerts</span>
            </div>
            <h1 className="qy-h1">
              Where your <em>stablecoins</em><br />should sit, right now.
            </h1>
            <p className="qy-hero-sub">
              QuickYield scans 500+ DeFi pools every hour, surfaces the beginner-safe routes, and emails you the second something moves. No wallet. No custody. No noise.
            </p>
            <div className="qy-hero-actions">
              <Link href="/dashboard" className="qy-btn qy-btn-primary qy-btn-glow qy-btn-lg" data-testid="hero-cta-primary">
                Start scanning free <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <a href="#how" className="qy-btn qy-btn-secondary qy-btn-lg" data-testid="hero-cta-secondary">
                See how it works
              </a>
            </div>
            <div className="qy-hero-protocols">
              <span>· Aave</span><span>· Compound</span><span>· Morpho</span><span>· Pendle</span><span>· Lido</span>
            </div>
          </div>

          <div className="qy-fade-up-delay-2 qy-preview-wrap">
            <div className="qy-preview-glow" />
            <div className="qy-preview qy-noise">
              <div className="qy-preview-bar">
                <span className="qy-preview-dot" /><span className="qy-preview-dot" /><span className="qy-preview-dot" />
                <div className="qy-preview-url">
                  <span className="qy-pill-dot" />
                  quickyield-scanner.vercel.app/dashboard
                </div>
              </div>
              <div className="qy-preview-grid">
                <div className="qy-preview-side">
                  {['Opportunities', 'Watchlist', 'Alerts', 'Settings'].map((s, i) => (
                    <div key={s} className={`qy-preview-side-item${i === 0 ? ' active' : ''}`}>{s}</div>
                  ))}
                </div>
                <div>
                  <div className="qy-preview-table-head">
                    <div>
                      <div className="qy-overline">Top opportunities</div>
                      <div style={{ marginTop: 2, fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink)' }}>Beginner-safe routes</div>
                    </div>
                    <span className="qy-pill" style={{ margin: 0, padding: '4px 12px' }}>Live</span>
                  </div>
                  {previewRows.map((r, i) => (
                    <div
                      key={r.p}
                      className="qy-preview-row qy-row-slide"
                      style={{ animationDelay: `${0.6 + i * 0.08}s` }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="qy-preview-icon" />
                        <div>
                          <strong>{r.p}</strong>
                          <div className="qy-mono" style={{ marginTop: 2 }}>{r.c} · {r.a}</div>
                        </div>
                      </div>
                      <div>{r.safe && <span className="qy-tag-safe">Safe</span>}</div>
                      <div className="qy-mono" style={{ textAlign: 'right' }}>{r.tvl}</div>
                      <div className="qy-num bold">{r.apy}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="qy-stats">
        <div className="qy-stats-grid">
          {[
            { l: 'Pools tracked', v: stats.total },
            { l: 'Total TVL', v: stats.tvl },
            { l: 'Beginner-safe', v: stats.safe },
            { l: 'Avg APY', v: stats.avg },
          ].map((s, i) => (
            <div key={s.l} className="qy-stats-cell qy-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="qy-stats-value">{s.v}</div>
              <div className="qy-overline" style={{ marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="qy-section">
        <div className="qy-container">
          <div className="qy-section-head">
            <span className="qy-overline qy-overline-signal">How it works</span>
            <h2 className="qy-h2">From overwhelming to obvious in four steps.</h2>
            <p>QuickYield watches yields for you and tells you what changed.</p>
          </div>
          <div className="qy-how-grid">
            {steps.map((s, i) => (
              <div key={s.n} className="qy-how-step qy-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="qy-how-step-top">
                  <span className="qy-how-step-num">{s.n}</span>
                  <s.icon className="qy-how-step-icon" />
                </div>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
                <span className="qy-how-underline" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE BENTO */}
      <section id="features" className="qy-section" style={{ paddingTop: 0 }}>
        <div className="qy-container">
          <div className="qy-section-head">
            <span className="qy-overline qy-overline-signal">Features</span>
            <h2 className="qy-h2">Built for crypto-curious and DeFi natives alike.</h2>
          </div>
          <div className="qy-bento">
            <div className="qy-bento-card qy-bento-hero qy-noise qy-fade-up">
              <span className="qy-overline qy-overline-signal">Live scanner</span>
              <h3>Curated yields, ranked by what matters.</h3>
              <p>Sort by APY, filter by chain or asset. Beginner-safe routes (Aave, Compound, Morpho, Lido) are tagged so you can act without second-guessing.</p>
              <div className="qy-bento-mini">
                <div className="qy-bento-mini-head">Top APYs · USDC</div>
                {[
                  { p: 'Pendle', c: 'Arbitrum', a: 12.4 },
                  { p: 'Morpho', c: 'Base', a: 9.34 },
                  { p: 'Aave v3', c: 'Arbitrum', a: 8.42 },
                  { p: 'Spark', c: 'Ethereum', a: 7.61 },
                  { p: 'Compound v3', c: 'Optimism', a: 6.18 },
                ].map((r) => (
                  <div key={r.p} className="qy-bento-mini-row">
                    <strong>{r.p}</strong>
                    <span>{r.c}</span>
                    <span className="qy-mono">{r.a.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="qy-bento-card qy-fade-up" style={{ animationDelay: '0.08s' }}>
              <Bell className="qy-icon" />
              <h3>Threshold alerts</h3>
              <p>"Email me if APY drops below 6%." Instant notifications when something moves.</p>
            </div>

            <div className="qy-bento-card green qy-fade-up" style={{ animationDelay: '0.16s' }}>
              <ShieldCheck className="qy-icon" />
              <h3>No custody, ever</h3>
              <p>We don't connect wallets, hold funds, or execute trades. Pure research and alerting.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="qy-section" style={{ paddingTop: 0 }}>
        <div className="qy-container">
          <div className="qy-section-head">
            <span className="qy-overline qy-overline-signal">Loved by users</span>
            <h2 className="qy-h2">Join 50+ users exploring DeFi yields with confidence.</h2>
          </div>
          <div className="qy-testimonials-grid">
            <div className="qy-testi-counter qy-fade-up">
              <Sparkles className="qy-testi-icon" fill="currentColor" />
              <blockquote>"QuickYield caught a rate drop I would have missed. Worth every second it takes to set up."</blockquote>
              <p style={{ marginTop: 8, color: 'var(--ink-dim)', fontSize: 13 }}>— Early user, DeFi yield farmer</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="qy-section" style={{ paddingTop: 0 }}>
        <div className="qy-container">
          <div className="qy-cta qy-noise qy-fade-up">
            <div className="qy-cta-glow" />
            <h2 className="qy-h2">Stop manually checking yields.<br />Start getting notified.</h2>
            <p>Free to start. No wallet connection. No spam. Just clarity on where your stablecoins should sit.</p>
            <Link href="/dashboard" className="qy-btn qy-btn-primary qy-btn-lg qy-btn-glow qy-cta-btn" data-testid="cta-getstarted">
              Get started free <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="qy-footer">
        <div className="qy-container">
          <div className="qy-footer-grid">
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink)' }}>QuickYield</div>
              <p style={{ marginTop: 8, color: 'var(--ink-dim)', fontSize: 12, maxWidth: 280 }}>
                Research and alerting for DeFi yields. Not financial advice. No custody. Always verify on the source protocol.
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
                <li>Data sourced from public DeFi APIs</li>
                <li><a href="#">Disclaimers</a></li>
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
        <div className="qy-footer-bottom">© 2026 QuickYield · Built for clarity in DeFi</div>
      </footer>
    </main>
  )
}
