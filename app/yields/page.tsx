import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Bell, Database, ShieldCheck } from 'lucide-react'
import { getOpportunities } from '../../lib/opportunities'
import { safetyGradeOf } from '../../lib/grade'
import { YieldTable } from '../../components/yield-table'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Safest DeFi Yields Right Now — Safety-Graded | QuickYield',
  description:
    'Live, safety-graded DeFi yield pools across major chains. See the safest stablecoin, ETH, and SOL yields right now — research only, no wallet, no custody.',
  alternates: { canonical: '/yields' },
}

export const FEATURED_ASSETS = ['USDC', 'USDT', 'DAI', 'ETH', 'STETH', 'SOL']

export default async function YieldsIndexPage() {
  const { opportunities, total } = await getOpportunities({ pageSize: 100 })
  const topSafe = opportunities
    .map((o) => ({ o, g: safetyGradeOf(o) }))
    .filter((x) => x.g.letter === 'A' || x.g.letter === 'B')
    .sort((a, b) => b.o.apy - a.o.apy)
    .slice(0, 12)
    .map((x) => x.o)

  return (
    <main>
      <section className="ql-section ql-yields-hero">
        <div className="ql-wrap">
          <span className="ql-eyebrow">Live · safety-graded</span>
          <h1 className="ql-h2" style={{ fontSize: 'var(--fs-display)', letterSpacing: '-0.03em' }}>
            The safest DeFi yields, <em style={{ color: 'var(--signal)', fontStyle: 'normal' }}>right now</em>.
          </h1>
          <p className="ql-lead">
            QuickYield scans {total.toLocaleString()}+ pools across major chains and grades each one A–F for safety —
            liquidity, APY stability, reward quality, and data completeness. Here are the strongest safe yields today.
          </p>
          <div className="ql-cta-row">
            <Link href="/terminal" className="ql-btn ql-btn--primary">Launch terminal <ArrowRight size={16} strokeWidth={2.5} /></Link>
            <Link href="/sign-up" className="ql-btn ql-btn--ghost">Set a free alert <Bell size={15} /></Link>
          </div>

          <div className="ql-asset-chips" aria-label="Browse by asset">
            {FEATURED_ASSETS.map((a) => (
              <Link key={a} href={`/yields/${a.toLowerCase()}`} className="ql-asset-chip">Best {a} yield</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">Top safe yields</span>
            <h2 className="ql-h2">Grade A–B, sorted by APY</h2>
            <p className="ql-lead">Higher yield among pools that pass our safety screen. Always verify with the protocol before acting.</p>
          </div>
          <YieldTable items={topSafe} />
        </div>
      </section>

      <section className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-trust">
            <span className="ql-eyebrow">How this works</span>
            <h2 className="ql-h2">Research-grade, not a data dump.</h2>
            <div className="ql-trust-grid">
              <div className="ql-trust-item"><h4><ShieldCheck size={18} />Safety Grade</h4><p>Every pool gets an A–F grade from liquidity, APY stability, reward quality, and data completeness.</p></div>
              <div className="ql-trust-item"><h4><Database size={18} />Transparent data</h4><p>Sourced from public DeFiLlama feeds, refreshed regularly, merged with our scoring.</p></div>
              <div className="ql-trust-item"><h4><Bell size={18} />Free alerts</h4><p>Create a rule and get a Telegram or email alert when a pool matches — or when one degrades.</p></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
