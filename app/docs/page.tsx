import type { Metadata } from 'next'
import Link from 'next/link'
import { ScrollText, ShieldCheck, Bell, Database } from 'lucide-react'
import { AnimatedSection } from '../../components/marketing/animated-section'
import { WeightBars } from '../../components/marketing/weight-bars'
import { BANDS } from '../../lib/grade'

export const metadata: Metadata = {
  title: 'Methodology — how Safety Grades work',
  description:
    'The published methodology behind Litmus Safety Grades: the four signals, their exact weights, the A–F thresholds, data sources and limitations, and the public grade ledger.',
  alternates: { canonical: '/docs' },
}

export default function DocsPage() {
  return (
    <>
      <div className="ql-docs-hero">
        <span className="ql-eyebrow">Methodology</span>
        <h1 className="ql-h2" style={{ marginTop: 'var(--sp-4)' }}>
          The methodology behind every grade.
        </h1>
        <p className="ql-lead">
          When we say &ldquo;yield research you can audit,&rdquo; this page is the thing you audit.
          The signals, the weights, and the thresholds below are the model&apos;s real constants —
          the same code that grades every pool renders this page.
        </p>
        <div className="ql-disclaimer" style={{ marginTop: 'var(--sp-5)' }}>
          <span>
            Safety Grades are our opinion under this published methodology. Informational only —
            not investment advice, not an audit, and not a guarantee. Verify with the underlying
            protocol before moving funds.
          </span>
        </div>
      </div>

      <AnimatedSection className="ql-docs-section" id="signals" as="div">
        <span className="ql-eyebrow"><Database size={12} /> The four signals</span>
        <h2>What a grade is made of</h2>
        <p>
          Every pool earns a 0–100 score — a weighted blend of four transparent signals. The grade
          also names its <em>weakest</em> signal, so an A-grade pool that is strong everywhere
          except reward quality tells you exactly where to look first.
        </p>
        <div className="ql-docs-grid">
          <WeightBars detailed />
          <div>
            <div className="ql-thresholds" style={{ marginTop: 0 }}>
              {BANDS.map((b) => (
                <div className="ql-threshold" key={b.letter}>
                  <b style={{ color: `var(--grade-${b.letter.toLowerCase()})` }}>{b.letter}</b>
                  <span>{b.min > 0 ? `score ≥ ${b.min}` : 'score < 45'}</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 'var(--sp-4)', color: 'var(--ink-dim)', fontSize: 'var(--fs-sm)', lineHeight: 1.65 }}>
              Thresholds are fixed, not curved — a pool is never graded on its neighbors. When the
              model changes, that change is published like every snapshot, so the methodology&apos;s
              own history is auditable too.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-docs-section" id="data" as="div">
        <span className="ql-eyebrow"><Database size={12} /> Data &amp; limitations</span>
        <h2>Where the data comes from — and where it stops</h2>
        <p>
          Pool data is sourced from public <strong>DeFiLlama</strong> feeds and refreshed on a live
          scan. Each scan is snapshotted, so Litmus accumulates its own APY and TVL history over
          time; pool detail pages also pull per-pool history directly from DeFiLlama for 30- and
          90-day context.
        </p>
        <p>
          Just as important is what a grade is <em>not</em>: it does not review smart-contract code,
          audit a protocol&apos;s team, or see anything the public market feed can&apos;t.{' '}
          <strong>A grade is not an audit.</strong> Data can be delayed or incomplete — always
          confirm on the protocol itself.
        </p>
      </AnimatedSection>

      <AnimatedSection className="ql-docs-section" id="ledger" as="div">
        <span className="ql-eyebrow"><ScrollText size={12} /> The record &amp; the on-chain ledger</span>
        <h2>Every grade, on the record, before the outcome</h2>
        <p>
          Every Monday, an automated job grades every live pool and publishes the full list as a
          dated, timestamped snapshot. Each snapshot is append-only and written <em>before</em> anyone
          knows how those pools perform — the opposite of a cherry-picked backtest. To make that
          tamper-proof rather than just &ldquo;trust us,&rdquo; each snapshot&apos;s hash is anchored
          on the <strong>Base blockchain</strong> — an immutable public ledger (launching soon). Every
          snapshot records, for every pool:
        </p>
        <div className="ql-docs-fields">
          {[
            ['poolId', 'stable DeFiLlama pool identifier'],
            ['project / chain / symbol', 'which protocol, network, and asset'],
            ['apy', 'the APY at grading time'],
            ['tvlUsd', 'pool TVL at grading time'],
            ['grade / score', 'the Safety Grade letter and its 0–100 score'],
          ].map(([code, desc]) => (
            <div className="ql-docs-field" key={code}>
              <code>{code}</code>
              <span>{desc}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 'var(--sp-4)' }}>
          See the running history, the grade-mix charts, and the on-chain verification status on the{' '}
          <Link href="/proof" style={{ color: 'var(--signal)' }}>track record page</Link>.
        </p>
      </AnimatedSection>

      <AnimatedSection className="ql-docs-section" id="alerts" as="div">
        <span className="ql-eyebrow"><Bell size={12} /> Alerts &amp; digest</span>
        <h2>Alerts in plain language</h2>
        <p>
          Alerts are built in plain language — pick what should trigger one and Litmus watches
          for it on every scan: APY rising above or dropping below your threshold, a sudden APY
          fall, TVL draining, or rewards making up too much of the yield. Alerts fire only on a
          real match — never spam — by email or Telegram. Separately, the weekly digest emails you
          every Sunday with your watchlist&apos;s APY and grade moves; one toggle turns it off.
        </p>
      </AnimatedSection>

      <AnimatedSection className="ql-docs-section" id="faq" as="div">
        <span className="ql-eyebrow"><ShieldCheck size={12} /> Frequently asked</span>
        <h2>Straight answers</h2>
        <div className="ql-faq">
          {[
            ['Is a Safety Grade an audit?', 'No. It is a published-methodology opinion computed from public market data. It does not review contract code or teams, and it is not a certification of safety.'],
            ['Does Litmus hold my funds?', 'No. It is non-custodial and never connects a wallet or executes transactions. It is research and alerting only.'],
            ['Is this financial advice?', 'No. Litmus provides research and signals; every decision and its consequences are yours.'],
            ['Where does the data come from?', 'Public DeFiLlama feeds, plus Litmus’s own accumulating snapshot history.'],
            ['Can past grades be edited?', 'No. Each weekly snapshot is recorded before its outcome is known and is append-only; on-chain anchoring on Base (launching soon) makes any change independently detectable. That is the point of the record.'],
          ].map(([q, a]) => (
            <div className="ql-faq-item" key={q}>
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-docs-section" as="div">
        <h2>Disclaimers</h2>
        <p>
          Onchain yield carries significant risk, including total loss of capital. Safety Grades
          and scores are estimates, not assurances. Verify every opportunity with the underlying
          protocol before moving funds. See our <Link href="/legal/terms" style={{ color: 'var(--signal)' }}>Terms</Link>,{' '}
          <Link href="/legal/privacy" style={{ color: 'var(--signal)' }}>Privacy</Link>, and{' '}
          <Link href="/legal/disclaimer" style={{ color: 'var(--signal)' }}>Disclaimer</Link> for the full picture.
        </p>
      </AnimatedSection>
    </>
  )
}
