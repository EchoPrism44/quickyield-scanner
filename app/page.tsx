import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  Database,
  Mail,
  Radio,
  ScrollText,
  ShieldCheck,
  Siren,
  Target,
  TrendingUp,
} from 'lucide-react'
import { MarketingNav } from '../components/marketing-nav'
import { MarketingFooter } from '../components/marketing/marketing-footer'
import { AnimatedSection } from '../components/marketing/animated-section'
import { AnimatedItem } from '../components/marketing/animated-item'
import { LedgerHero } from '../components/marketing/ledger-hero'
import { TickerTape } from '../components/marketing/ticker-tape'
import { TerminalPreview } from '../components/marketing/terminal-preview'
import { StatCounter } from '../components/marketing/stat-counter'
import { WeightBars } from '../components/marketing/weight-bars'
import { getLedgerSummary } from '../lib/ledger'
import { getOpportunities } from '../lib/opportunities'
import { BANDS } from '../lib/grade'

export const revalidate = 1800

const proofItems = ['No wallet connection', 'No custody', 'Research only', 'Telegram + email alerts']

const problems = [
  { icon: Database, t: 'Everything, all at once', b: 'Public feeds list thousands of pools with no view on what is safe, sustainable, or right for you. Signal drowns in volume.' },
  { icon: Siren, t: 'Noise over signal', b: 'Alpha chats and threads are loud, late, and unaccountable. By the time you hear it, the yield has already moved.' },
  { icon: TrendingUp, t: 'High APY is often a trap', b: 'Headline rates are frequently mercenary incentives that collapse. Without context, the best number is the worst bet.' },
]

const steps = [
  { n: '01', icon: Radio, t: 'Scan', b: 'We index every major onchain yield pool the public market feed covers and keep it live in the background.' },
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

export default async function HomePage() {
  const ledger = getLedgerSummary()
  const feed = await getOpportunities({ capital: 100, pageSize: 12 })
  const opportunities = feed.opportunities

  const firstYear = ledger ? ledger.totals.firstDate.slice(0, 4) : null
  const firstMonth = ledger
    ? new Date(`${ledger.totals.firstDate}T00:00:00Z`).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
    : null

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      {/* ---------------- Hero: the accountability claim ---------------- */}
      <section className="ql-hero">
        <div className="ql-hero-aurora" aria-hidden="true" />
        <div className="ql-wrap ql-hero-body">
          <div>
            <span className="ql-badge">
              <span className="ql-dot" />
              Public grade record · updated weekly
            </span>
            <h1 className="ql-h1">
              Yield research you can <em>audit</em>, not just trust.
            </h1>
            <p className="ql-hero-sub">
              Litmus grades every live onchain yield pool A–F under a published methodology —
              and publishes every grade to a public, timestamped record before the outcome is known.
            </p>
            <div className="ql-cta-row">
              <Link href="/terminal" className="ql-btn ql-btn--primary">
                Launch terminal <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link href="/proof" className="ql-btn ql-btn--ghost">
                See the track record <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="ql-proof">
              {proofItems.map((p) => <span key={p}>{p}</span>)}
            </div>
          </div>
          <LedgerHero ledger={ledger} />
        </div>
      </section>

      {/* ---------------- Ticker ---------------- */}
      <TickerTape rows={opportunities} />

      {/* ---------------- Real-number stats ---------------- */}
      <div className="ql-stats">
        <div className="ql-stats-grid">
          <div className="ql-stat">
            <div className="ql-stat-v">
              {ledger ? <StatCounter value={ledger.latest.count} /> : <StatCounter value={feed.total} />}
            </div>
            <div className="ql-stat-l">Pools graded last snapshot</div>
          </div>
          <div className="ql-stat">
            <div className="ql-stat-v">{ledger ? <StatCounter value={ledger.latest.chains} /> : '—'}</div>
            <div className="ql-stat-l">Chains in the record</div>
          </div>
          <div className="ql-stat">
            <div className="ql-stat-v">
              {ledger ? <StatCounter value={ledger.totals.snapshotCount} /> : '—'}
            </div>
            <div className="ql-stat-l">
              Public snapshots{firstMonth ? ` since ${firstMonth} ${firstYear}` : ''}
            </div>
          </div>
          <div className="ql-stat">
            <div className="ql-stat-v">Weekly</div>
            <div className="ql-stat-l">Record cadence · every Monday</div>
          </div>
        </div>
      </div>

      {/* ---------------- Problem ---------------- */}
      <AnimatedSection className="ql-section">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">The problem</span>
            <h2 className="ql-h2">Chasing yield is a full-time job with bad information.</h2>
          </div>
          <div className="ql-cards-3">
            {problems.map((p) => (
              <AnimatedItem className="ql-card" key={p.t} hoverLift>
                <div className="ql-card-ic"><p.icon size={20} /></div>
                <h3>{p.t}</h3>
                <p>{p.b}</p>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ---------------- How grading works ---------------- */}
      <AnimatedSection className="ql-section ql-section--tight" id="features">
        <div className="ql-wrap ql-intel">
          <div>
            <span className="ql-eyebrow">The methodology</span>
            <h2 className="ql-h2">Every pool gets a Safety Grade.</h2>
            <p className="ql-lead">
              Litmus doesn&apos;t just list yields — it scores them. Four transparent signals,
              weighted exactly as published, distilled into one letter. The weights below are the
              model&apos;s real constants, not marketing.
            </p>
            <ul className="ql-intel-list">
              {pillars.map((p) => (
                <li key={p.t}><Check size={16} strokeWidth={3} /><span><b>{p.t}.</b> {p.b}</span></li>
              ))}
            </ul>
          </div>
          <AnimatedItem className="ql-scorecard">
            <div className="ql-scorecard-top">
              <div className="ql-grade-badge">A</div>
              <div>
                <h4>What a grade is made of</h4>
                <p>Signal weights · from the model</p>
              </div>
            </div>
            <div className="ql-bars">
              <WeightBars />
              <div className="ql-thresholds">
                {BANDS.map((b) => (
                  <div className="ql-threshold" key={b.letter}>
                    <b style={{ color: `var(--grade-${b.letter.toLowerCase()})` }}>{b.letter}</b>
                    <span>{b.min > 0 ? `≥ ${b.min}` : `< 45`}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedItem>
        </div>
      </AnimatedSection>

      {/* ---------------- How it works ---------------- */}
      <AnimatedSection className="ql-section ql-section--tight" id="how">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">How it works</span>
            <h2 className="ql-h2">From market noise to a rule that fires.</h2>
          </div>
          <div className="ql-steps">
            {steps.map((s) => (
              <AnimatedItem className="ql-step" key={s.n}>
                <div className="ql-step-top">
                  <span className="ql-step-n">{s.n}</span>
                  <s.icon className="ql-step-ic" size={20} />
                </div>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ---------------- Live terminal + alerts ---------------- */}
      <AnimatedSection className="ql-section ql-section--tight" id="alerts">
        <div className="ql-wrap ql-intel">
          <div>
            <span className="ql-eyebrow">Stay ahead</span>
            <h2 className="ql-h2">Know the moment yield moves — or turns.</h2>
            <p className="ql-lead">
              Set plain-language rules — APY rises or drops, TVL drains, rewards spike — and get a
              Telegram or email alert the moment a pool actually matches. Every Sunday, one digest
              with your watchlist&apos;s grade moves. Never spam.
            </p>
            <ul className="ql-intel-list">
              <li><Bell size={16} strokeWidth={3} /><span><b>Real-time alerts.</b> Fire only when a pool matches your rule.</span></li>
              <li><Mail size={16} strokeWidth={3} /><span><b>Weekly digest.</b> Your watchlist&apos;s APY and grade moves, one email.</span></li>
            </ul>
          </div>
          <AnimatedItem>
            <TerminalPreview rows={opportunities} />
          </AnimatedItem>
        </div>
      </AnimatedSection>

      {/* ---------------- Transparency & trust ---------------- */}
      <AnimatedSection className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-trust">
            <span className="ql-eyebrow">Built on transparency</span>
            <h2 className="ql-h2">Check us. That&apos;s the point.</h2>
            <div className="ql-trust-grid">
              <div className="ql-trust-item">
                <h4><ScrollText size={18} />A record that can&apos;t be rewritten</h4>
                <p>
                  Every Monday, every live pool&apos;s grade is timestamped and published before the
                  outcome is known — and anchored on Base so it can&apos;t be quietly changed.{' '}
                  <Link href="/proof" style={{ color: 'var(--signal)' }}>
                    See the track record →
                  </Link>
                </p>
              </div>
              <div className="ql-trust-item">
                <h4><ShieldCheck size={18} />No custody, ever</h4>
                <p>Litmus never touches your funds, keys, or wallet. There is no deposit, no trade button, no custody. It is research and alerting only.</p>
              </div>
              <div className="ql-trust-item">
                <h4><Database size={18} />Transparent data</h4>
                <p>Pool data is sourced from public DeFiLlama feeds and merged with our scoring. Every Safety Grade names its weakest signal.</p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ---------------- Disclaimer band ---------------- */}
      <section className="ql-section ql-section--tight" style={{ paddingBlock: 'var(--sp-6)' }}>
        <div className="ql-wrap">
          <div className="ql-disclaimer">
            <span>
              Safety Grades are our opinion under a published methodology. Informational only — not
              investment advice, not an audit, and not a guarantee. Read the{' '}
              <Link href="/docs">methodology</Link> and the{' '}
              <Link href="/legal/disclaimer">full disclaimer</Link>.
            </span>
          </div>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <AnimatedSection className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-final">
            <span className="ql-eyebrow" style={{ justifyContent: 'center' }}>Get started free</span>
            <h2 className="ql-h2">Research yield in the open.</h2>
            <p>
              A live scanner, transparent Safety Grades, personal alerts — and a public record of
              every call we make. No wallet, no custody, no noise.
            </p>
            <div className="ql-cta-row">
              <Link href="/terminal" className="ql-btn ql-btn--primary">
                Launch terminal <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link href="/sign-up" className="ql-btn ql-btn--ghost">Create account</Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <MarketingFooter />
    </main>
  )
}
