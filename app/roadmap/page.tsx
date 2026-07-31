import type { Metadata } from 'next'
import Link from 'next/link'
import { Ban, Check, Compass, Hammer } from 'lucide-react'
import { AnimatedSection } from '../../components/marketing/animated-section'
import { getLedgerSummary } from '../../lib/ledger'

export const metadata: Metadata = {
  title: 'Roadmap — what’s shipped, what’s next, what we’re exploring',
  description:
    'What QuickYield has shipped, what is being built next, and the directions we are exploring — plus the things we have decided we will never do.',
  alternates: { canonical: '/roadmap' },
}

export const revalidate = 1800

type Item = { title: string; body: string }

const SHIPPED: Item[] = [
  {
    title: 'The weekly grade record',
    body: 'Every Monday we grade every live pool and publish the result, before anyone knows how those pools play out. The record only ever grows — a past week is never edited.',
  },
  {
    title: 'A–F Safety Grades on a published methodology',
    body: 'Liquidity, APY stability, reward quality and data completeness, with the exact weights and thresholds documented on the methodology page.',
  },
  {
    title: 'A terminal anyone can browse',
    body: 'Grades, filters and pool research are public — no account needed. Signing in adds a watchlist, alerts and settings.',
  },
  {
    title: 'Plain-language alerts',
    body: 'APY rises or drops, TVL drains, reward spikes — delivered by email or Telegram, plus a weekly digest.',
  },
  {
    title: 'Weekly research, from our own data',
    body: 'Every post is generated from the same snapshots that power the grades, with charts drawn from the record rather than stock illustrations.',
  },
  {
    title: 'Tokenized real-world assets',
    body: 'Treasuries, T-bills and on-chain private credit sit in the same feed and get the same grade — because they settle on-chain, they carry the same public data trail.',
  },
]

const BUILDING: Item[] = [
  {
    title: 'Anchoring the record on Base',
    body: 'A contract that stores each week’s snapshot hash, so the record is verifiable by anyone instead of trusted. The contract is written and tested on Base Sepolia; mainnet follows at launch.',
  },
  {
    title: 'Comparing any two weeks',
    body: 'The diff that drives our weekly research — upgrades, downgrades, capital movement — surfaced in the product instead of only in the write-up.',
  },
  {
    title: 'More ways to read the record',
    body: 'As the archive deepens, views that only make sense with months of history: grade migration, distribution shifts, and per-protocol timelines.',
  },
]

const EXPLORING: Item[] = [
  {
    title: 'A research API',
    body: 'Programmatic access to grades and their history, for teams that want to build on the record. Not built yet — we would rather hear what people actually need first.',
  },
  {
    title: 'A research assistant',
    body: 'Software that reads the record and explains what changed in plain English — the same analysis we write by hand each week, personalised to the pools you follow. It would explain and suggest; you would decide and act. It would never move funds.',
  },
  {
    title: 'A separate lens for centralised yield',
    body: 'Exchange earn products are custodial, so our on-chain signals do not describe their real risk. Covering them honestly would mean a distinctly different model, clearly labelled as such — not this grade stretched to fit.',
  },
  {
    title: 'Letting others act on the feed',
    body: 'If the grade record is public and verifiable, other systems can subscribe to it and set their own automated rules on top. We are interested in being the dependable signal underneath that — not in operating it.',
  },
]

const NEVER: string[] = [
  'Take custody of your funds, your keys, or your exchange API keys.',
  'Execute trades, move money, or manage a portfolio on your behalf.',
  'Publish a risk metric we do not actually measure, or dress up an estimate as an audit.',
  'Edit or quietly delete a grade we already published.',
]

export default function RoadmapPage() {
  const ledger = getLedgerSummary()

  return (
    <>
      <div className="ql-docs-hero">
        <span className="ql-eyebrow">Roadmap</span>
        <h1 className="ql-h2" style={{ marginTop: 'var(--sp-4)' }}>
          Where this is going.
        </h1>
        <p className="ql-lead">
          QuickYield is built around one asset that compounds: a timestamped record of what we said
          about every pool, published before the outcome was known
          {ledger ? ` — ${ledger.totals.snapshotCount} weeks of it so far, starting ${ledger.totals.firstDate}` : ''}.
          Everything below is either built on that record or in service of it.
        </p>
        <div className="ql-disclaimer" style={{ marginTop: 'var(--sp-5)' }}>
          <span>
            Directional, not a commitment. Anything under &ldquo;exploring&rdquo; may change shape or
            be dropped entirely — it is published so you can see how we think, not as a promise of
            delivery. Nothing here is a financial product or investment advice.
          </span>
        </div>
      </div>

      <AnimatedSection className="ql-docs-section" id="shipped" as="div">
        <span className="ql-eyebrow"><Check size={12} /> Shipped</span>
        <h2>Live today</h2>
        <p>Working now, in the product you can open in a browser.</p>
        <div className="ql-roadmap-list">
          {SHIPPED.map((i) => (
            <div className="ql-roadmap-item ql-roadmap-item--done" key={i.title}>
              <h3>{i.title}</h3>
              <p>{i.body}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-docs-section" id="building" as="div">
        <span className="ql-eyebrow"><Hammer size={12} /> Building</span>
        <h2>What comes next</h2>
        <p>Work that is underway or clearly scoped.</p>
        <div className="ql-roadmap-list">
          {BUILDING.map((i) => (
            <div className="ql-roadmap-item ql-roadmap-item--now" key={i.title}>
              <h3>{i.title}</h3>
              <p>{i.body}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-docs-section" id="exploring" as="div">
        <span className="ql-eyebrow"><Compass size={12} /> Exploring</span>
        <h2>Directions we are thinking about</h2>
        <p>
          Not started, not promised, and deliberately unscheduled. These get built if the record gets
          deep enough to support them and people actually want them.
        </p>
        <div className="ql-roadmap-list">
          {EXPLORING.map((i) => (
            <div className="ql-roadmap-item ql-roadmap-item--later" key={i.title}>
              <h3>{i.title}</h3>
              <p>{i.body}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-docs-section" id="never" as="div">
        <span className="ql-eyebrow"><Ban size={12} /> Boundaries</span>
        <h2>What we will never do</h2>
        <p>
          A roadmap is more useful when it also says where the road stops. These are not
          &ldquo;not yet&rdquo; items — they are decisions.
        </p>
        <ul className="ql-roadmap-never">
          {NEVER.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p style={{ marginTop: 'var(--sp-5)' }}>
          Research stays research. That boundary is what makes the grade worth trusting —{' '}
          <Link href="/docs">read the methodology</Link> or{' '}
          <Link href="/proof">see the track record</Link>.
        </p>
      </AnimatedSection>
    </>
  )
}
