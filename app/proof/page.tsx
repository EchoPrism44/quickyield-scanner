import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, GitCommit } from 'lucide-react'
import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'
import { AnimatedSection } from '../../components/marketing/animated-section'
import { SnapshotTimeline, DistributionEvolution } from '../../components/marketing/snapshot-timeline'
import { StatCounter } from '../../components/marketing/stat-counter'
import { getLedgerSummary, LEDGER_REPO_URL } from '../../lib/ledger'

export const metadata: Metadata = {
  title: 'Track record — the public grade ledger',
  description:
    'Every week QuickYield grades every live pool and commits it to a public, timestamped record anyone can inspect. No edits, no hindsight, no survivorship bias.',
  alternates: { canonical: '/proof' },
}

/**
 * On-chain anchoring is planned but NOT live. When the GradeLedger contract
 * is deployed on Base, set its address here and the card below starts
 * rendering it. Until then the copy stays strictly future-tense.
 */
const GRADE_LEDGER_CONTRACT: string | null = null

export default function ProofPage() {
  const ledger = getLedgerSummary()

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <div className="ql-wrap">
        <div className="ql-proof-hero">
          <span className="ql-eyebrow">Accountability</span>
          <h1 className="ql-h2" style={{ marginTop: 'var(--sp-4)' }}>Graded in the open.</h1>
          <p className="ql-lead">
            We won&apos;t show you a backtest, because an honest one is impossible — the pools that
            fail vanish from public data, so any &ldquo;our grades predicted doom&rdquo; chart is
            survivorship bias dressed up as proof. So we do the opposite.{' '}
            <strong>Every week we grade every live pool and commit it to a public, timestamped
            record</strong> anyone can inspect. No edits. No hindsight. The track record builds in
            the open — and the future judges us.
          </p>
          <div className="ql-cta-row">
            <a href={LEDGER_REPO_URL} target="_blank" rel="noreferrer" className="ql-btn ql-btn--primary">
              <GitCommit size={16} strokeWidth={2.5} /> Open the public ledger
            </a>
            <Link href="/docs" className="ql-btn ql-btn--ghost">Read the methodology</Link>
          </div>
        </div>
      </div>

      {ledger && (
        <div className="ql-stats" style={{ marginTop: 'var(--sp-7)' }}>
          <div className="ql-stats-grid">
            <div className="ql-stat">
              <div className="ql-stat-v"><StatCounter value={ledger.totals.snapshotCount} /></div>
              <div className="ql-stat-l">Weekly snapshots on record</div>
            </div>
            <div className="ql-stat">
              <div className="ql-stat-v"><StatCounter value={ledger.latest.count} /></div>
              <div className="ql-stat-l">Pools graded last Monday</div>
            </div>
            <div className="ql-stat">
              <div className="ql-stat-v"><StatCounter value={ledger.totals.poolsGradedCumulative} /></div>
              <div className="ql-stat-l">Grades recorded, cumulative</div>
            </div>
            <div className="ql-stat">
              <div className="ql-stat-v">{ledger.totals.firstDate}</div>
              <div className="ql-stat-l">Ledger running since</div>
            </div>
          </div>
        </div>
      )}

      {ledger && (
        <AnimatedSection className="ql-section ql-section--tight">
          <div className="ql-wrap">
            <div className="ql-head">
              <span className="ql-eyebrow">Distribution over time</span>
              <h2 className="ql-h2">How the grades have moved.</h2>
              <p className="ql-lead">
                Each strip is one committed snapshot — the share of pools at each grade, A through
                F. Descriptive only: this shows what we said, not yet how it played out.
              </p>
            </div>
            <DistributionEvolution snapshots={ledger.snapshots} />
          </div>
        </AnimatedSection>
      )}

      {ledger && (
        <AnimatedSection className="ql-section ql-section--tight">
          <div className="ql-wrap">
            <div className="ql-head">
              <span className="ql-eyebrow">The record</span>
              <h2 className="ql-h2">Every snapshot, newest first.</h2>
            </div>
            <SnapshotTimeline snapshots={ledger.snapshots} />
          </div>
        </AnimatedSection>
      )}

      <AnimatedSection className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">Verify it yourself</span>
            <h2 className="ql-h2">Don&apos;t take our word for any of this.</h2>
          </div>
          <div className="ql-proof-steps">
            <div className="ql-proof-step">
              <p><strong style={{ color: 'var(--ink)' }}>Open the repository.</strong> The ledger lives in a public GitHub repo at <code style={{ color: 'var(--brand-green)' }}>data/grades/</code> — no account needed.</p>
            </div>
            <div className="ql-proof-step">
              <p><strong style={{ color: 'var(--ink)' }}>Pick any dated file.</strong> Each one lists every pool we graded that Monday with its grade and score.</p>
            </div>
            <div className="ql-proof-step">
              <p><strong style={{ color: 'var(--ink)' }}>Check the commit timestamp.</strong> Git records when each snapshot was written — before its outcomes were known.</p>
            </div>
          </div>

          <div className="ql-trust" style={{ marginTop: 'var(--sp-6)' }}>
            <span className="ql-eyebrow">Why this is the honest proof</span>
            <p style={{ marginTop: 'var(--sp-4)', color: 'var(--ink-dim)', fontSize: 'var(--fs-base)', lineHeight: 1.7, maxWidth: '72ch' }}>
              A public commit history can&apos;t be quietly rewritten — every grade carries a git
              timestamp from before its outcome was known. Because we record <em>every</em> pool we
              grade (including the ones that later die), there&apos;s no survivorship bias: the
              failures stay in the record. The predictive record matures over the coming months,
              and we make no claim it can&apos;t yet support — grades are descriptive estimates of
              current pool quality, not guarantees.
            </p>
            {GRADE_LEDGER_CONTRACT ? (
              <p style={{ marginTop: 'var(--sp-4)', color: 'var(--ink-dim)', fontSize: 'var(--fs-sm)' }}>
                Each snapshot&apos;s hash is also anchored on Base:{' '}
                <a
                  href={`https://basescan.org/address/${GRADE_LEDGER_CONTRACT}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--signal)', fontFamily: 'var(--font-mono)' }}
                >
                  {GRADE_LEDGER_CONTRACT}
                </a>
              </p>
            ) : (
              <p style={{ marginTop: 'var(--sp-4)', color: 'var(--ink-mute)', fontSize: 'var(--fs-sm)' }}>
                Planned, not live yet: anchoring each snapshot&apos;s hash on Base so the record is
                verifiable on-chain as well as in git. This page will show the contract address
                when it ships.
              </p>
            )}
          </div>

          <div className="ql-disclaimer" style={{ marginTop: 'var(--sp-5)' }}>
            <span>
              Safety Grades are our opinion under a published methodology. Informational only — not
              investment advice, not an audit, and not a guarantee. Always verify with the
              underlying protocol before depositing.
            </span>
          </div>

          <div className="ql-cta-row" style={{ marginTop: 'var(--sp-6)' }}>
            <Link href="/terminal" className="ql-btn ql-btn--primary">
              See live grades <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link href="/yields" className="ql-btn ql-btn--ghost">Browse public yields</Link>
          </div>
        </div>
      </AnimatedSection>

      <MarketingFooter />
    </main>
  )
}
