import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowRight, Bell } from 'lucide-react'
import { getOpportunities } from '../../../lib/opportunities'
import { safetyGradeOf } from '../../../lib/grade'
import { YieldTable } from '../../../components/yield-table'
import { FEATURED_ASSETS } from '../page'

export const revalidate = 1800

const GRADE_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 }

async function loadAsset(assetParam: string) {
  const asset = assetParam.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
  if (!asset) return null
  const { opportunities } = await getOpportunities({ q: asset, pageSize: 100 })
  const items = opportunities
    .filter((o) => o.asset.toUpperCase() === asset)
    .map((o) => ({ o, g: safetyGradeOf(o) }))
    .sort((a, b) => GRADE_ORDER[a.g.letter] - GRADE_ORDER[b.g.letter] || b.o.apy - a.o.apy)
    .map((x) => x.o)
  return { asset, items }
}

export async function generateMetadata({ params }: { params: Promise<{ asset: string }> }): Promise<Metadata> {
  const { asset: raw } = await params
  const data = await loadAsset(raw)
  if (!data) return { title: 'Yield not found | QuickYield' }
  const best = data.items[0]
  const bestLine = best ? ` Top safe pool: ${best.platform} at ${best.apy.toFixed(2)}% APY.` : ''
  return {
    title: `Best & Safest ${data.asset} Yield Right Now | QuickYield`,
    description: `Live, safety-graded ${data.asset} yield pools across major chains.${bestLine} Research only — no wallet, no custody.`,
    alternates: { canonical: `/yields/${data.asset.toLowerCase()}` },
  }
}

export default async function AssetYieldsPage({ params }: { params: Promise<{ asset: string }> }) {
  const { asset: raw } = await params
  const data = await loadAsset(raw)
  if (!data) notFound()
  const { asset, items } = data
  const best = items[0]
  const others = FEATURED_ASSETS.filter((a) => a !== asset)

  return (
    <main>
      <section className="ql-section ql-yields-hero">
        <div className="ql-wrap">
          <Link href="/yields" className="ql-legal-back" style={{ marginBottom: 'var(--sp-5)' }}>← All yields</Link>
          <span className="ql-eyebrow">Live · safety-graded</span>
          <h1 className="ql-h2" style={{ fontSize: 'var(--fs-display)', letterSpacing: '-0.03em' }}>
            Best &amp; safest <em style={{ color: 'var(--signal)', fontStyle: 'normal' }}>{asset}</em> yield right now.
          </h1>
          <p className="ql-lead">
            {items.length > 0
              ? `${items.length} ${asset} pools tracked. ${best ? `Strongest safe pick: ${best.platform} on ${best.chain} at ${best.apy.toFixed(2)}% APY.` : ''} Sorted by Safety Grade, then APY.`
              : `No ${asset} pools match the safety screen right now — check back after the next scan.`}
          </p>
          <div className="ql-cta-row">
            <Link href="/terminal" className="ql-btn ql-btn--primary">Open in terminal <ArrowRight size={16} strokeWidth={2.5} /></Link>
            <Link href="/sign-up" className="ql-btn ql-btn--ghost">Alert me on {asset} <Bell size={15} /></Link>
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
          <div className="ql-head">
            <span className="ql-eyebrow">Other assets</span>
            <h2 className="ql-h2">Browse more safe yields</h2>
          </div>
          <div className="ql-asset-chips">
            {others.map((a) => (
              <Link key={a} href={`/yields/${a.toLowerCase()}`} className="ql-asset-chip">Best {a} yield</Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
