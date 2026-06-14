import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, GitCommit } from 'lucide-react'
import { MarketingNav } from '../../components/marketing-nav'

export const metadata: Metadata = {
  title: 'Graded in the open — QuickYield',
  description:
    'We can’t fake a backtest, so we do the honest thing: every week we grade every live DeFi pool and commit it to a public, timestamped record. No edits, no hindsight.',
}

const LEDGER_URL = 'https://github.com/EchoPrism44/quickyield-scanner/tree/main/data/grades'
const GRADES = ['A', 'B', 'C', 'D', 'F'] as const
const COLOR: Record<(typeof GRADES)[number], string> = {
  A: '#34d399', B: '#38d5ff', C: '#f59e0b', D: '#fb923c', F: '#f87171',
}

type Snapshot = { date: string; count: number; pools: Array<{ grade: string }> }

function latestSnapshot(): Snapshot | null {
  try {
    const dir = join(process.cwd(), 'data', 'grades')
    const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
    const last = files.at(-1)
    if (!last) return null
    return JSON.parse(readFileSync(join(dir, last), 'utf8')) as Snapshot
  } catch {
    return null
  }
}

export default function ProofPage() {
  const snap = latestSnapshot()
  const dist = GRADES.map((g) => ({ g, n: snap ? snap.pools.filter((p) => p.grade === g).length : 0 }))
  const max = Math.max(1, ...dist.map((d) => d.n))
  const snapDate = snap ? new Date(snap.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null

  return (
    <>
      <MarketingNav />
      <main className="ql-legal">
        <div className="ql-legal-wrap" style={{ maxWidth: 800 }}>
          <Link href="/" className="ql-legal-back">← Back to home</Link>

          <span className="ql-eyebrow">Accountability</span>
          <h1>Graded in the open.</h1>
          <p className="ql-lead" style={{ marginTop: 8 }}>
            We won&apos;t show you a backtest, because an honest one is impossible — the pools that fail vanish from
            public data, so any &ldquo;our grades predicted doom&rdquo; chart is survivorship bias dressed up as proof.
            So we do the opposite. <strong>Every week we grade every live pool and commit it to a public, timestamped
            record</strong> anyone can audit. No edits. No hindsight. The track record builds in the open — and the
            future judges us.
          </p>

          <div className="ql-legal-cta" style={{ margin: '22px 0 8px' }}>
            <a href={LEDGER_URL} target="_blank" rel="noreferrer" className="ql-btn ql-btn--primary">
              <GitCommit size={16} strokeWidth={2.5} /> See the public ledger
            </a>
          </div>

          {snap ? (
            <>
              <h2>This week&apos;s grades</h2>
              <p style={{ color: '#8baabf', fontSize: 14 }}>
                {snap.count.toLocaleString()} live pools graded · committed {snapDate}.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '20px 0 8px' }}>
                {dist.map(({ g, n }) => (
                  <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span aria-hidden style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      width: 32, height: 30, borderRadius: 7, fontWeight: 800, color: '#050a12', background: COLOR[g],
                    }}>{g}</span>
                    <div style={{ flex: 1, height: 18, borderRadius: 5, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(2, (n / max) * 100)}%`, height: '100%', borderRadius: 5, background: COLOR[g] }} />
                    </div>
                    <span className="qy-mono" style={{ width: 96, textAlign: 'right', fontSize: 13 }}>{n.toLocaleString()} pools</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <h2>Why this is the honest proof</h2>
          <p>
            A public commit history can&apos;t be quietly rewritten — every grade carries a git timestamp from before
            its outcome was known. Because we record <em>every</em> pool we grade (including the ones that later die),
            there&apos;s no survivorship bias: the failures stay in the record. In a space full of unaccountable
            alpha-callers, a tool that publishes its calls in public and lets you check them is the differentiator.
          </p>
          <p>
            The predictive record matures over the coming months. We make no claim it can&apos;t yet support — grades
            are descriptive estimates of current pool quality, not guarantees. Always verify with the underlying
            protocol before depositing.
          </p>

          <div className="ql-legal-cta" style={{ marginTop: 26 }}>
            <Link href="/terminal" className="ql-btn ql-btn--primary">See live grades <ArrowRight size={16} strokeWidth={2.5} /></Link>
            <Link href="/docs" className="ql-btn ql-btn--ghost">Read the methodology</Link>
          </div>
        </div>
      </main>
    </>
  )
}
