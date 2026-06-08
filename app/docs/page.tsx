import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Documentation — QuickYield',
  description:
    'How QuickYield works: the Safety Grade methodology, data sources, alerts and the weekly digest, and the research-only model.',
}

export default function DocsPage() {
  return (
    <>
      <h1>Documentation</h1>
      <div className="ql-legal-meta">How QuickYield scans, scores, and alerts</div>

      <div className="ql-legal-note">
        QuickYield is a research and alerting tool — not a financial adviser, broker, or custodian. It never holds your
        funds or keys. Everything below explains how the product reaches its conclusions so you can judge them for
        yourself, then verify with the underlying protocol before acting.
      </div>

      <h2>Overview</h2>
      <p>
        QuickYield continuously scans live DeFi yield pools across major chains, ranks them with a transparent scoring
        model, and surfaces a plain-English <strong>Safety Grade</strong> for every pool. You can save pools to a
        watchlist, set plain-language alerts, and receive a weekly digest — all without connecting a wallet or giving up
        custody. The goal is simple: surface <em>safer</em> yield before the crowd, and filter out the noise and the
        traps.
      </p>

      <h2>The Safety Grade</h2>
      <p>
        Every pool earns a letter grade from <strong>A</strong> (very safe) to <strong>F</strong>, distilled from a
        0–100 score. The score is a weighted blend of four transparent signals — the same four shown on each pool&apos;s
        detail page:
      </p>
      <ul>
        <li><strong>Liquidity</strong> — is there enough TVL and market depth for the yield to be real and exitable?</li>
        <li><strong>APY stability</strong> — is the rate steady over time, or did it spike only in the latest feed?</li>
        <li><strong>Reward quality</strong> — is it sustainable base yield, or propped up by incentive tokens that fade?</li>
        <li><strong>Data completeness</strong> — how much history and market context backs the score?</li>
      </ul>
      <p>
        The grade also names its <em>weakest</em> factor, so an A-grade pool that is strong everywhere except reward
        quality tells you exactly where to look. Grades are heuristic estimates, not guarantees — they are a starting
        point for research, never a recommendation to deposit.
      </p>

      <h2>Data &amp; sources</h2>
      <p>
        Pool data is sourced from public <strong>DeFiLlama</strong> feeds and refreshed on a live scan. Each scan is
        also snapshotted, so QuickYield accumulates its own APY and TVL history over time. On a pool&apos;s detail page
        the APY/TVL chart pulls real per-pool history directly from DeFiLlama — so you can see 30-day and 90-day
        behavior immediately, not just since you started tracking it. Data can be delayed or incomplete; always confirm
        on the protocol itself.
      </p>

      <h2>Alerts &amp; the weekly digest</h2>
      <p>
        Alerts are built in plain language — pick what should trigger one and QuickYield watches for it on every scan:
      </p>
      <ul>
        <li><strong>APY rises above / drops below</strong> a threshold you set.</li>
        <li><strong>APY drops fast</strong> — a sudden fall of N points in 24 hours.</li>
        <li><strong>TVL drains</strong> — the pool loses a share of its liquidity since the last scan.</li>
        <li><strong>Reward-reliant</strong> — incentive tokens make up too much of the APY.</li>
      </ul>
      <p>
        Alerts fire only on a real match — never spam — and arrive by <strong>email or Telegram</strong>. Separately,
        the <strong>weekly Safe Yield digest</strong> emails you every Sunday with your watchlist&apos;s APY and grade
        moves plus the top safer picks you aren&apos;t already tracking. The digest is on by default and can be turned
        off with a single toggle in Settings.
      </p>

      <h2>Frequently asked</h2>
      <p><strong>Does QuickYield hold my funds?</strong> No. It is non-custodial and never connects a wallet or executes
        transactions. It is informational only.</p>
      <p><strong>Is this financial advice?</strong> No. QuickYield provides research and signals; every decision and its
        consequences are yours.</p>
      <p><strong>Where does the data come from?</strong> Public DeFiLlama feeds, plus QuickYield&apos;s own accumulating
        snapshot history.</p>
      <p><strong>How often does it update?</strong> The market feed runs on a live scan; the weekly digest sends every
        Sunday.</p>

      <h2>Disclaimers</h2>
      <p>
        DeFi carries significant risk, including total loss of capital. Safety Grades and scores are estimates, not
        assurances. Verify every opportunity with the underlying protocol before moving funds. See our{' '}
        <Link href="/legal/terms">Terms</Link>, <Link href="/legal/privacy">Privacy</Link>, and{' '}
        <Link href="/legal/disclaimer">Disclaimer</Link> for the full picture.
      </p>
    </>
  )
}
