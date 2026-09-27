import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'
import { AnimatedSection } from '../../components/marketing/animated-section'
import { RiskCards } from '../../components/marketing/risk-cards'
import { GradeDistributionChart } from '../../components/marketing/grade-distribution-chart'
import { SafeShareTrend } from '../../components/marketing/safe-share-trend'
import { SnapshotTimeline } from '../../components/marketing/snapshot-timeline'
import { OnChainBadge } from '../../components/marketing/onchain-badge'
import { getLedgerSummary } from '../../lib/ledger'
import { GRADE_LEDGER_CONTRACT, ledgerBasescanUrl } from '../../lib/onchain'

export const metadata: Metadata = {
  title: 'Track record — every grade, on the record',
  description:
    'Every week Litmus grades every live pool and publishes the record — anchored on Base so it can’t be quietly rewritten. No edits, no hindsight, no survivorship bias.',
  alternates: { canonical: '/proof' },
}

export default function ProofPage() {
  const ledger = getLedgerSummary()
  const basescanUrl = ledgerBasescanUrl()

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <div className="ql-wrap">
        <div className="ql-proof-hero">
          <span className="ql-eyebrow">Accountability</span>
          <h1 className="ql-h2" style={{ marginTop: 'var(--sp-4)' }}>Graded in the open.</h1>
          <p className="ql-lead">
            We won&apos;t sell you a cherry-picked backtest — the pools that fail vanish from public
            data, so a naive &ldquo;our grades predicted doom&rdquo; chart is just survivorship bias
            dressed up as proof. So we do the harder thing.{' '}
            <strong>Every week we grade every live pool and publish the record</strong> — recorded
            before the outcome is known, and anchored on-chain so it can&apos;t be quietly rewritten.
            Then we test the grades against that record the honest way, counting the pools that
            vanished as failures — including when the answer isn&apos;t flattering.
          </p>
          <div style={{ marginTop: 'var(--sp-5)' }}>
            <OnChainBadge />
          </div>
        </div>
      </div>

      {ledger && (
        <>
          <AnimatedSection className="ql-section ql-section--tight" as="div">
            <div className="ql-wrap">
              <div className="ql-head">
                <span className="ql-eyebrow">This week</span>
                <h2 className="ql-h2">The latest grades at a glance.</h2>
              </div>
              <RiskCards latest={ledger.latest} />
            </div>
          </AnimatedSection>

          <AnimatedSection className="ql-section ql-section--tight" as="div">
            <div className="ql-wrap">
              <div className="ql-head">
                <span className="ql-eyebrow">Grade mix over time</span>
                <h2 className="ql-h2">How the grades have moved.</h2>
                <p className="ql-lead">
                  The share of pools at each grade, A through F, across every weekly snapshot.
                  Descriptive only — this shows what we said, not yet how it played out.
                </p>
              </div>
              <GradeDistributionChart snapshots={ledger.snapshots} />
            </div>
          </AnimatedSection>

          <AnimatedSection className="ql-section ql-section--tight" as="div">
            <div className="ql-wrap">
              <div className="ql-head">
                <span className="ql-eyebrow">Safe share</span>
                <h2 className="ql-h2">Pools graded A or B, week over week.</h2>
              </div>
              <SafeShareTrend snapshots={ledger.snapshots} />
            </div>
          </AnimatedSection>

          <AnimatedSection className="ql-section ql-section--tight" as="div">
            <div className="ql-wrap">
              <div className="ql-head">
                <span className="ql-eyebrow">The record</span>
                <h2 className="ql-h2">Every snapshot, newest first.</h2>
              </div>
              <SnapshotTimeline snapshots={ledger.snapshots} />
            </div>
          </AnimatedSection>
        </>
      )}

      <AnimatedSection className="ql-section ql-section--tight" as="div">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">How verification works</span>
            <h2 className="ql-h2">Why this is the honest proof.</h2>
          </div>
          <div className="ql-proof-steps">
            <div className="ql-proof-step">
              <p><strong style={{ color: 'var(--ink)' }}>Recorded before the outcome.</strong> Every Monday we grade every live pool and write the result down — while nobody yet knows how those pools will perform.</p>
            </div>
            <div className="ql-proof-step">
              <p><strong style={{ color: 'var(--ink)' }}>Every pool, no cherry-picking.</strong> The failures stay in the record too, so there&apos;s no survivorship bias hiding the misses.</p>
            </div>
            <div className="ql-proof-step">
              <p>
                {GRADE_LEDGER_CONTRACT ? (
                  <><strong style={{ color: 'var(--ink)' }}>Anchored on Base.</strong> Each snapshot&apos;s hash is written to our on-chain ledger, so the record is tamper-proof — verify it yourself on Basescan.</>
                ) : (
                  <><strong style={{ color: 'var(--ink)' }}>Append-only, anchoring soon.</strong> The record only grows; a past week can&apos;t be edited. On-chain anchoring on Base is launching soon to make that cryptographically verifiable.</>
                )}
              </p>
            </div>
          </div>

          <div className="ql-trust" style={{ marginTop: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span className="ql-eyebrow">The on-chain ledger</span>
              <OnChainBadge size="sm" />
            </div>
            <p style={{ marginTop: 'var(--sp-4)', color: 'var(--ink-dim)', fontSize: 'var(--fs-base)', lineHeight: 1.7, maxWidth: '72ch' }}>
              {GRADE_LEDGER_CONTRACT && basescanUrl ? (
                <>
                  Each weekly snapshot&apos;s hash is anchored to our GradeLedger contract on Base.
                  Because the chain is append-only, a grade we published can never be quietly changed
                  after the fact — anyone can confirm the on-chain hash matches the record.{' '}
                  <a href={basescanUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--signal)', fontFamily: 'var(--font-mono)' }}>
                    View the contract on Basescan ↗
                  </a>
                </>
              ) : (
                <>
                  The record is recorded before outcomes are known and is append-only. On-chain
                  anchoring on Base — writing each snapshot&apos;s hash to an immutable ledger so the
                  record is verifiable by anyone, not just trusted — is launching soon. The predictive
                  track record matures over the coming months; grades are descriptive estimates of
                  current pool quality, not guarantees.
                </>
              )}
            </p>
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
            <Link href="/docs" className="ql-btn ql-btn--ghost">Read the methodology</Link>
          </div>
        </div>
      </AnimatedSection>

      <MarketingFooter />
    </main>
  )
}
