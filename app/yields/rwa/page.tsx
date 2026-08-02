import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Bell, Landmark } from 'lucide-react'
import { getOpportunities } from '../../../lib/opportunities'
import { safetyGradeOf } from '../../../lib/grade'
import { isRwaOpportunity } from '../../../lib/rwa'
import { YieldTable } from '../../../components/yield-table'
import { FEATURED_ASSETS } from '../page'

export const revalidate = 1800

const GRADE_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 }

async function loadRwa() {
  const { opportunities } = await getOpportunities({ pageSize: 100 })
  return opportunities
    .filter(isRwaOpportunity)
    .map((o) => ({ o, g: safetyGradeOf(o) }))
    .sort((a, b) => GRADE_ORDER[a.g.letter] - GRADE_ORDER[b.g.letter] || b.o.apy - a.o.apy)
    .map((x) => x.o)
}

export const metadata: Metadata = {
  title: 'Best RWA & Tokenized T-Bill Yields — Safety-Graded | Litmus',
  description:
    'Live, safety-graded yields on tokenized real-world assets — treasuries, T-bills, and on-chain private credit (Ondo, BlackRock BUIDL, Maple, Centrifuge, OpenEden and more). Research only, no wallet, no custody.',
  alternates: { canonical: '/yields/rwa' },
}

export default async function RwaYieldsPage() {
  const items = await loadRwa()
  const best = items[0]

  return (
    <main>
      <section className="ql-section ql-yields-hero">
        <div className="ql-wrap">
          <Link href="/yields" className="ql-legal-back" style={{ marginBottom: 'var(--sp-5)' }}>← All yields</Link>
          <span className="ql-eyebrow">Live · safety-graded</span>
          <h1 className="ql-h2" style={{ fontSize: 'var(--fs-display)', letterSpacing: '-0.03em' }}>
            Best <em style={{ color: 'var(--signal)', fontStyle: 'normal' }}>RWA</em> &amp; tokenized T-bill yields.
          </h1>
          <p className="ql-lead">
            {items.length > 0
              ? `${items.length} tokenized real-world-asset pools tracked — treasuries, T-bills, and on-chain private credit. ${best ? `Strongest safe pick: ${best.platform} on ${best.chain} at ${best.apy.toFixed(2)}% APY.` : ''} Sorted by Safety Grade, then APY.`
              : 'No RWA pools match the safety screen right now — check back after the next scan.'}
          </p>
          <div className="ql-cta-row">
            <Link href="/terminal" className="ql-btn ql-btn--primary">Open in terminal <ArrowRight size={16} strokeWidth={2.5} /></Link>
            <Link href="/sign-up" className="ql-btn ql-btn--ghost">Alert me on RWA <Bell size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <YieldTable items={items} />
        </div>
      </section>

      <section className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-trust">
            <span className="ql-eyebrow">What counts as RWA here</span>
            <h2 className="ql-h2"><Landmark size={20} style={{ marginRight: 8, verticalAlign: '-3px' }} />On-chain, so it&apos;s auditable.</h2>
            <p className="ql-lead" style={{ maxWidth: '70ch' }}>
              These are tokenized real-world assets that live on-chain — money-market funds, short-term
              treasuries and private credit from protocols like Ondo, BlackRock&apos;s BUIDL, Maple,
              Centrifuge and OpenEden. Because they settle on-chain, they carry the same public,
              verifiable data trail every other pool here does, and they get the same A–F Safety Grade.
              Grades are our opinion under a published methodology — not investment advice, and never a
              substitute for reading the issuer&apos;s own disclosures.
            </p>
          </div>
          <div className="ql-asset-chips" style={{ marginTop: 'var(--sp-5)' }}>
            {FEATURED_ASSETS.map((a) => (
              <Link key={a} href={`/yields/${a.toLowerCase()}`} className="ql-asset-chip">Best {a} yield</Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
