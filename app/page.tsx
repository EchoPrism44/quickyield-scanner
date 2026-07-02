'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Bell,
  Check,
  Database,
  Mail,
  Radio,
  ShieldCheck,
  Siren,
  Target,
  TrendingUp,
} from 'lucide-react'
import { MarketingNav } from '../components/marketing-nav'
import { AlertsShowcase } from '../components/marketing/alerts-showcase'
import { DiscoverShowcase } from '../components/marketing/discover-showcase'
import { computeSafetyGrade } from '../lib/grade'
import type { Opportunity } from '../lib/types'

const fallbackOpportunities: Opportunity[] = [
  {
    id: 'landing-lido-steth', rank: 1, name: 'STETH yield pool', platform: 'Lido',
    category: 'ETH staking', chain: 'Ethereum', asset: 'STETH', symbol: 'STETH',
    apy: 2.36, trend: 'flat', trendValue: 0.08, risk: 'Low', minimum: 100, time: 'Ongoing',
    tvl: '$31.2B', tvlUsd: 31200000000, gas: 'Medium', confidence: 96, dailyLow: 2.22, dailyHigh: 2.46,
    action: 'View details', actionUrl: 'https://lido.fi/', officialUrl: 'https://lido.fi/',
    sourceUrl: 'https://defillama.com/yields', protocolSlug: 'lido', source: 'Curated',
    notes: 'High TVL and stable APY.', rankReason: 'High TVL and stable APY', flags: ['High TVL', 'Stable APY'],
    lastSeenAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), volatility: 8, dataCompleteness: 94,
    scoreBreakdown: { liquidity: 98, stability: 92, sustainability: 86, completeness: 94 },
  },
  {
    id: 'landing-aave-usdc', rank: 2, name: 'USDC lending market', platform: 'Aave',
    category: 'Stablecoin lending', chain: 'Base', asset: 'USDC', symbol: 'USDC',
    apy: 8.4, trend: 'up', trendValue: 0.34, risk: 'Medium', minimum: 100, time: '15 min',
    tvl: '$487M', tvlUsd: 487000000, gas: 'Low', confidence: 88, dailyLow: 7.88, dailyHigh: 8.62,
    action: 'View details', actionUrl: 'https://app.aave.com/', officialUrl: 'https://aave.com/',
    sourceUrl: 'https://defillama.com/yields', protocolSlug: 'aave', source: 'Curated',
    notes: 'Higher APY, review reward quality.', rankReason: 'Higher APY, review reward quality', flags: ['Stablecoin', 'Review rewards'],
    lastSeenAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), volatility: 22, dataCompleteness: 90,
    scoreBreakdown: { liquidity: 86, stability: 78, sustainability: 72, completeness: 90 },
  },
  {
    id: 'landing-jito-sol', rank: 3, name: 'SOL staking yield', platform: 'Jito',
    category: 'Solana yield', chain: 'Solana', asset: 'SOL', symbol: 'SOL',
    apy: 7.1, trend: 'up', trendValue: 0.21, risk: 'Medium', minimum: 50, time: 'Ongoing',
    tvl: '$1.5B', tvlUsd: 1500000000, gas: 'Low', confidence: 84, dailyLow: 6.81, dailyHigh: 7.24,
    action: 'View details', actionUrl: 'https://www.jito.network/', officialUrl: 'https://www.jito.network/',
    sourceUrl: 'https://defillama.com/yields', protocolSlug: 'jito', source: 'Curated',
    notes: 'Strong TVL with moving APY.', rankReason: 'Strong TVL with moving APY', flags: ['Liquid staking', 'Moving APY'],
    lastSeenAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), volatility: 18, dataCompleteness: 86,
    scoreBreakdown: { liquidity: 88, stability: 74, sustainability: 78, completeness: 86 },
  },
  {
    id: 'landing-curve-crvusd', rank: 4, name: 'crvUSD pool', platform: 'Curve',
    category: 'Stablecoin lending', chain: 'Ethereum', asset: 'crvUSD', symbol: 'crvUSD',
    apy: 11.2, trend: 'down', trendValue: 0.42, risk: 'Medium', minimum: 100, time: '15 min',
    tvl: '$214M', tvlUsd: 214000000, gas: 'High', confidence: 79, dailyLow: 10.6, dailyHigh: 12.1,
    action: 'View details', actionUrl: 'https://curve.fi/', officialUrl: 'https://curve.fi/',
    sourceUrl: 'https://defillama.com/yields', protocolSlug: 'curve', source: 'Curated',
    notes: 'Incentive-heavy, watch sustainability.', rankReason: 'Incentive-heavy, watch sustainability', flags: ['Incentivized'],
    lastSeenAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), volatility: 34, dataCompleteness: 82,
    scoreBreakdown: { liquidity: 78, stability: 66, sustainability: 58, completeness: 82 },
  },
  {
    id: 'landing-rocket-reth', rank: 5, name: 'rETH staking', platform: 'Rocket Pool',
    category: 'ETH staking', chain: 'Ethereum', asset: 'rETH', symbol: 'rETH',
    apy: 3.1, trend: 'up', trendValue: 0.05, risk: 'Low', minimum: 50, time: 'Ongoing',
    tvl: '$2.8B', tvlUsd: 2800000000, gas: 'Medium', confidence: 91, dailyLow: 3.0, dailyHigh: 3.2,
    action: 'View details', actionUrl: 'https://rocketpool.net/', officialUrl: 'https://rocketpool.net/',
    sourceUrl: 'https://defillama.com/yields', protocolSlug: 'rocket-pool', source: 'Curated',
    notes: 'Decentralized staking, stable APY.', rankReason: 'Decentralized staking, stable APY', flags: ['Liquid staking'],
    lastSeenAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), volatility: 6, dataCompleteness: 92,
    scoreBreakdown: { liquidity: 92, stability: 90, sustainability: 84, completeness: 92 },
  },
]

const proofItems = ['No wallet connection', 'No custody', 'Research only', 'Telegram + email alerts']

const problems = [
  { icon: Database, t: 'Everything, all at once', b: 'DeFiLlama lists thousands of pools with no view on what is safe, sustainable, or right for you. Signal drowns in volume.' },
  { icon: Siren, t: 'Noise over signal', b: 'Alpha chats and threads are loud, late, and unaccountable. By the time you hear it, the yield has already moved.' },
  { icon: TrendingUp, t: 'High APY is often a trap', b: 'Headline rates are frequently mercenary incentives that collapse. Without context, the best number is the worst bet.' },
]

const steps = [
  { n: '01', icon: Radio, t: 'Scan', b: 'We index 500+ DeFi yield pools across major chains and keep the feed live in the background.' },
  { n: '02', icon: Target, t: 'Set rules', b: 'Describe what you want in plain language: asset, APY threshold, chain, and maximum risk.' },
  { n: '03', icon: Bell, t: 'Get alerted', b: 'A Telegram or email alert fires only when a pool actually matches your rule — never spam.' },
  { n: '04', icon: ShieldCheck, t: 'Research', b: 'Open the pool, read the Safety Grade and risk context, and verify before acting elsewhere.' },
]

const pillars = [
  { t: 'Liquidity', b: 'Is there enough market depth for the yield to be real and exitable?' },
  { t: 'APY stability', b: 'Is the rate steady over time, or did it spike only in the latest feed?' },
  { t: 'Reward quality', b: 'Is it base yield, or propped up by incentives that will fade?' },
  { t: 'Data completeness', b: 'How much history and market context backs the score?' },
]

function gradeFor(item: Opportunity): { letter: string; cls: string } {
  const letter = (item.safety ?? computeSafetyGrade(item.scoreBreakdown)).letter
  return { letter, cls: `ql-grade-${letter.toLowerCase()}` }
}

function trendText(item: Opportunity) {
  const sign = item.trend === 'down' ? '-' : '+'
  const cls = item.trend === 'down' ? 'ql-down' : 'ql-up'
  return { text: `${sign}${Math.abs(item.trendValue).toFixed(2)}%`, cls }
}

function useCountUp(target: number, active: boolean, duration = 1100) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (target <= 0 || reduce) {
      const id = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(id)
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return value
}

function useScrollAnimation(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ql-in-view')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
}

function LiveTerminal({ rows }: { rows: Opportunity[] }) {
  return (
    <div className="ql-terminal ql-reveal" aria-label="Live yield scanner preview">
      <div className="ql-terminal-bar">
        <i /><i /><i />
        <span>quickyield // live scanner</span>
        <b><span className="ql-dot" />synced</b>
      </div>
      <div className="ql-thead">
        <span>Pool</span><span>APY</span><span>Grade</span><span>24h</span>
      </div>
      {rows.map((item, i) => {
        const grade = gradeFor(item)
        const t = trendText(item)
        return (
          <div className="ql-trow" key={item.id} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="ql-asset">
              <b>{item.platform}</b>
              <small>{item.asset} · {item.chain}</small>
            </div>
            <span className="ql-apy">{item.apy.toFixed(2)}%</span>
            <span><span className={`ql-grade-chip ${grade.cls}`}>{grade.letter}</span></span>
            <span className={t.cls}>{t.text}</span>
          </div>
        )
      })}
      <div className="ql-terminal-foot">
        scanning 500+ pools across major chains<span className="ql-cursor" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(fallbackOpportunities)
  const [total, setTotal] = useState(500)
  const [chainCount, setChainCount] = useState(8)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetch('/api/opportunities?capital=100&pageSize=12')
      .then((r) => r.json())
      .then((data: { opportunities?: Opportunity[]; total?: number }) => {
        const items = data.opportunities ?? []
        if (!items.length) return
        setOpportunities(items)
        setChainCount(new Set(items.map((i) => i.chain)).size || 8)
        if (data.total && data.total > 0) setTotal(data.total)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect() } }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const terminalRows = useMemo(() => opportunities.slice(0, 5), [opportunities])
  const tickerRows = useMemo(() => {
    const base = opportunities.slice(0, 8)
    return [...base, ...base]
  }, [opportunities])

  const animatedTotal = useCountUp(total, statsVisible)
  const animatedChains = useCountUp(chainCount, statsVisible)

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      {/* ---------------- Hero ---------------- */}
      <section className="ql-hero">
        <div className="ql-hero-aurora" aria-hidden="true" />
        <div className="ql-wrap ql-hero-body">
          <div>
            <span className="ql-badge"><span className="ql-dot" />DeFi yield intelligence · beta</span>
            <h1 className="ql-h1">The Bloomberg Terminal for <em>DeFi yield</em>.</h1>
            <p className="ql-hero-sub">
              QuickYield scans 500+ yield pools across major chains, grades them for safety, and alerts you the moment one matches your rules — before everyone else.
            </p>
            <div className="ql-cta-row">
              <Link href="/terminal" className="ql-btn ql-btn--primary">
                Launch terminal <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <a href="#how" className="ql-btn ql-btn--ghost">See how it works</a>
            </div>
            <div className="ql-proof">
              {proofItems.map((p) => <span key={p}>{p}</span>)}
            </div>
          </div>
          <LiveTerminal rows={terminalRows} />
        </div>
      </section>

      {/* ---------------- Ticker ---------------- */}
      <div className="ql-tape" aria-hidden="true">
        <div className="ql-tape-track">
          {tickerRows.map((item, i) => {
            const t = trendText(item)
            return (
              <span className="ql-tape-item" key={`${item.id}-${i}`}>
                {item.asset} <b>{item.apy.toFixed(2)}%</b> <span className={t.cls}>{t.text}</span>
              </span>
            )
          })}
        </div>
      </div>

      {/* ---------------- Credibility strip ---------------- */}
      <section className="ql-stats" ref={statsRef}>
        <div className="ql-stats-grid">
          <div className="ql-stat"><div className="ql-stat-v">{animatedTotal.toLocaleString()}+</div><div className="ql-stat-l">Pools scanned</div></div>
          <div className="ql-stat"><div className="ql-stat-v">{animatedChains}+</div><div className="ql-stat-l">Chains covered</div></div>
          <div className="ql-stat"><div className="ql-stat-v">Hourly</div><div className="ql-stat-l">Scan cadence</div></div>
          <div className="ql-stat"><div className="ql-stat-v">2-way</div><div className="ql-stat-l">Telegram + email</div></div>
        </div>
      </section>

      {/* ---------------- Problem ---------------- */}
      <section className="ql-section">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">The problem</span>
            <h2 className="ql-h2">Yield hunting is loud, slow, and dangerous.</h2>
            <p className="ql-lead">Three failure modes keep good capital out of good opportunities — and into bad ones.</p>
          </div>
          <div className="ql-cards-3">
            {problems.map((p) => (
              <article className="ql-card" key={p.t}>
                <div className="ql-card-ic"><p.icon size={20} /></div>
                <h3>{p.t}</h3>
                <p>{p.b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="ql-section ql-section--tight" id="how">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">How it works</span>
            <h2 className="ql-h2">From market noise to a single alert.</h2>
          </div>
          <div className="ql-steps">
            {steps.map((s) => (
              <div className="ql-step" key={s.n}>
                <div className="ql-step-top">
                  <span className="ql-step-n">{s.n}</span>
                  <s.icon className="ql-step-ic" size={20} />
                </div>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Intelligence layer ---------------- */}
      <section className="ql-section ql-section--tight" id="features">
        <div className="ql-wrap ql-intel">
          <div>
            <span className="ql-eyebrow">The intelligence layer</span>
            <h2 className="ql-h2">Every pool gets a Safety Grade.</h2>
            <p className="ql-lead">
              QuickYield doesn&apos;t just list yields — it scores them. The Safety Grade distills four transparent signals into one letter, so you can judge an opportunity in a glance and act with context.
            </p>
            <ul className="ql-intel-list">
              {pillars.map((p) => (
                <li key={p.t}><Check size={16} strokeWidth={3} /><span><b>{p.t}.</b> {p.b}</span></li>
              ))}
            </ul>
          </div>
          <div className="ql-scorecard ql-reveal">
            <div className="ql-scorecard-top">
              <div className="ql-grade-badge">A</div>
              <div>
                <h4>Lido · STETH</h4>
                <p>Ethereum · ETH staking</p>
              </div>
            </div>
            <div className="ql-bars">
              {[
                { l: 'Liquidity', v: 98 },
                { l: 'APY stability', v: 92 },
                { l: 'Reward quality', v: 86 },
                { l: 'Data completeness', v: 94 },
              ].map((b) => (
                <div className="ql-bar-row" key={b.l}>
                  <div className="ql-bar-head"><span>{b.l}</span><b>{b.v}/100</b></div>
                  <div className="ql-bar"><i style={{ width: `${b.v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Stay ahead (alerts + digest) with live showcases ---------------- */}
      <section className="ql-section ql-section--tight" id="alerts">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">Stay ahead</span>
            <h2 className="ql-h2">Know the moment yield moves — or turns.</h2>
          </div>
          <div className="ql-steps ql-steps--two">
            <div className="ql-step">
              <div className="ql-step-top">
                <Bell className="ql-step-ic" size={20} />
              </div>
              <h3>Real-time alerts</h3>
              <p>
                Set plain-language rules — APY rises or drops, TVL drains, rewards spike — and get a Telegram or email
                alert the moment a pool actually matches. Only real signal, never spam.
              </p>
            </div>
            <div className="ql-step">
              <div className="ql-step-top">
                <Mail className="ql-step-ic" size={20} />
              </div>
              <h3>Weekly Safe Yield digest</h3>
              <p>
                Every Sunday, a single email with your watchlist&apos;s APY and grade moves plus the top safer picks you
                aren&apos;t tracking yet. Stay current without watching the screen — one toggle to opt out.
              </p>
            </div>
          </div>

          {/* Live Alerts & Discover Showcase */}
          <div className="ql-showcases-grid ql-reveal" style={{ marginTop: 'var(--sp-8)' }}>
            <AlertsShowcase items={opportunities} />
            <DiscoverShowcase items={opportunities} />
          </div>
        </div>
      </section>

      {/* ---------------- Product preview ---------------- */}
      <section className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">The terminal</span>
            <h2 className="ql-h2">A research desk, not a data dump.</h2>
          </div>
          <div className="ql-shot ql-reveal">
            <div className="ql-shot-bar">
              <i /><i /><i />
              <span className="ql-shot-url">quickyield.app/terminal</span>
            </div>
            <div className="ql-shot-body">
              <div className="ql-shot-side">
                <div className="ql-shot-navitem on">Discover</div>
                <div className="ql-shot-navitem">Watchlist</div>
                <div className="ql-shot-navitem">Alerts</div>
                <div className="ql-shot-navitem">Settings</div>
              </div>
              <div className="ql-shot-main">
                {opportunities.slice(0, 6).map((item) => {
                  const grade = gradeFor(item)
                  const t = trendText(item)
                  return (
                    <div className="ql-shot-row" key={item.id}>
                      <div className="ql-asset"><b style={{ color: 'var(--ink)' }}>{item.platform}</b> <span style={{ color: 'var(--ink-mute)' }}>{item.asset}</span></div>
                      <span style={{ color: 'var(--ink)' }}>{item.apy.toFixed(2)}%</span>
                      <span><span className={`ql-grade-chip ${grade.cls}`}>{grade.letter}</span></span>
                      <span className={t.cls}>{t.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Trust band ---------------- */}
      <section className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-trust">
            <span className="ql-eyebrow">Built on trust</span>
            <h2 className="ql-h2">Research-grade, by design.</h2>
            <div className="ql-trust-grid">
              <div className="ql-trust-item">
                <h4><ShieldCheck size={18} />No custody, ever</h4>
                <p>QuickYield never touches your funds, keys, or wallet. There is no deposit, no trade button, no custody. It is research and alerting only.</p>
              </div>
              <div className="ql-trust-item">
                <h4><Database size={18} />Transparent data</h4>
                <p>Pool data is sourced from public DeFiLlama feeds and merged with our scoring. Every Safety Grade links back to the underlying signals.</p>
              </div>
              <div className="ql-trust-item">
                <h4><Check size={18} />Not financial advice</h4>
                <p>We surface context, not recommendations. You always verify with the protocol and decide for yourself before moving any capital.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-final ql-reveal">
            <span className="ql-eyebrow" style={{ justifyContent: 'center' }}>Get started free</span>
            <h2 className="ql-h2">Find safer yield. Before everyone else.</h2>
            <p>500+ pool scanner, transparent Safety Grades, and personal alerts — no wallet, no custody, no noise.</p>
            <div className="ql-cta-row">
              <Link href="/terminal" className="ql-btn ql-btn--primary">
                Launch terminal <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link href="/sign-up" className="ql-btn ql-btn--ghost">Create account</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="ql-footer">
        <div className="ql-wrap">
          <div className="ql-footer-grid">
            <div>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>QuickYield</strong>
              <p className="ql-footer-blurb">Yield intelligence and alerting for DeFi. Research only. Not financial advice. No custody — always verify with the protocol before moving funds.</p>
            </div>
            <div>
              <h5>Product</h5>
              <ul>
                <li><a href="#how">How it works</a></li>
                <li><a href="#features">Safety Grade</a></li>
                <li><Link href="/proof">Graded in the open</Link></li>
                <li><Link href="/yields">Best yields</Link></li>
                <li><Link href="/docs">Documentation</Link></li>
                <li><Link href="/terminal">Launch terminal</Link></li>
              </ul>
            </div>
            <div>
              <h5>Alerts</h5>
              <ul>
                <li>Telegram alerts</li>
                <li>Email alerts</li>
                <li>Personal rules</li>
              </ul>
            </div>
            <div>
              <h5>Legal</h5>
              <ul>
                <li><Link href="/legal/terms">Terms</Link></li>
                <li><Link href="/legal/privacy">Privacy</Link></li>
                <li><Link href="/legal/disclaimer">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="ql-footer-base">
            <span>© 2026 QuickYield</span>
            <span>Signal over noise</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
