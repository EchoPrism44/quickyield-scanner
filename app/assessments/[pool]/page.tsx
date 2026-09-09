import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Check, ShieldCheck } from 'lucide-react'
import { MarketingNav } from '../../../components/marketing-nav'
import { MarketingFooter } from '../../../components/marketing/marketing-footer'
import { AnimatedSection } from '../../../components/marketing/animated-section'
import { AnimatedItem } from '../../../components/marketing/animated-item'

const ASSESSMENTS: Record<string, {
  protocol: string
  pool: string
  chain: string
  date: string
  grade: { letter: string; score: number; label: string; summary: string; weakest: string }
  signals: { liquidity: number; stability: number; sustainability: number; completeness: number }
  strengths: string[]
  watchpoints: string[]
  methodologyVersion: string
}> = {
  'example-usdc': {
    protocol: 'Example Protocol',
    pool: 'USDC Pool',
    chain: 'Ethereum',
    date: '2026-09-07',
    grade: {
      letter: 'B',
      score: 78,
      label: 'Safe',
      summary: 'Weighted blend of liquidity, APY stability, reward quality, and data completeness. Weakest factor: APY stability (72/100).',
      weakest: 'APY stability',
    },
    signals: { liquidity: 84, stability: 72, sustainability: 81, completeness: 91 },
    strengths: ['Strong liquidity base', 'Good data availability'],
    watchpoints: ['APY volatility observed', 'Reward dependence noted'],
    methodologyVersion: 'v1.0',
  },
}

export async function generateMetadata({ params }: { params: Promise<{ pool: string }> }): Promise<Metadata> {
  const { pool } = await params
  const assessment = ASSESSMENTS[pool]
  
  if (!assessment) {
    return { title: 'Assessment Not Found | Litmus' }
  }

  const { protocol, pool: poolName, chain, date, grade } = assessment

  return {
    title: `${protocol} — ${poolName} Assessment (Grade ${grade.letter}) | Litmus`,
    description: `Litmus independent A–F assessment for ${protocol} ${poolName} on ${chain}. Grade: ${grade.letter} (${grade.score}/100). ${grade.summary}`,
    openGraph: {
      title: `${protocol} ${poolName} — Litmus Grade ${grade.letter}`,
      description: `${grade.letter} grade (${grade.score}/100) — ${grade.summary}`,
      type: 'website',
      url: `/assessments/${pool}`,
      images: [{
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: `${protocol} ${poolName} Litmus Grade ${grade.letter}`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${protocol} ${poolName} — Litmus Grade ${grade.letter}`,
      description: `${grade.letter} grade (${grade.score}/100)`,
    },
    alternates: {
      canonical: `/assessments/${pool}`,
    },
  }
}

export default async function AssessmentPage({ params }: { params: Promise<{ pool: string }> }) {
  const { pool } = await params
  const assessment = ASSESSMENTS[pool]

  if (!assessment) {
    notFound()
  }

  const { protocol, pool: poolName, chain, date, grade, signals, strengths, watchpoints, methodologyVersion } = assessment

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${protocol} ${poolName} Litmus Assessment`,
    description: `${grade.letter} grade (${grade.score}/100) — ${grade.summary}`,
    datePublished: date,
    dateModified: date,
    mainEntityOfPage: `https://www.getlitmus.xyz/assessments/${pool}`,
    author: {
      '@type': 'Organization',
      '@id': 'https://www.getlitmus.xyz/#organization',
      name: 'Litmus',
      url: 'https://www.getlitmus.xyz',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://www.getlitmus.xyz/#organization',
      name: 'Litmus',
      url: 'https://www.getlitmus.xyz',
    },
    about: {
      '@type': 'DefinedTerm',
      name: 'DeFi yield pool assessment',
    },
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <section className="ql-hero ql-hero--compact">
        <div className="ql-hero-aurora" aria-hidden="true" />
        <div className="ql-wrap ql-hero-body ql-hero-body--compact">
          <div>
            <span className="ql-badge">
              <span className="ql-dot" />
              Independent Protocol Assessment
            </span>
            <h1 className="ql-h1">
              {protocol} — {poolName}
            </h1>
            <p className="ql-hero-sub">
              Litmus Independent Protocol Assessment · {formatDate(date)}
            </p>
            <div className="ql-grade-display">
              <span className={`ql-grade-letter ql-grade-${grade.letter.toLowerCase()}`}>{grade.letter}</span>
              <span className="ql-grade-label">{grade.label}</span>
            </div>
          </div>
          <div className="ql-assessment-meta">
            <div><strong>Chain:</strong> {chain}</div>
            <div><strong>Methodology:</strong> Litmus {methodologyVersion}</div>
            <div><strong>Assessed:</strong> {formatDate(date)}</div>
          </div>
        </div>
      </section>

      <AnimatedSection className="ql-section ql-section--tight">
        <div className="ql-wrap ql-intel">
          <div>
            <span className="ql-eyebrow">Signal Breakdown</span>
            <h2 className="ql-h2">Quantitative signals</h2>
            <p className="ql-lead">
              Each signal scored 0–100. Weighted per published methodology to produce the final grade.
            </p>
          </div>
          <div className="ql-signals-grid">
            <AnimatedItem className="ql-signal-card">
              <div className="ql-signal-header">
                <h3>Liquidity</h3>
                <span className={`ql-signal-score ql-grade-${signals.liquidity >= 85 ? 'a' : signals.liquidity >= 72 ? 'b' : signals.liquidity >= 60 ? 'c' : signals.liquidity >= 45 ? 'd' : 'f'}`}>
                  {signals.liquidity}
                </span>
              </div>
              <div className="ql-signal-bar"><div className="ql-signal-fill" style={{width: `${signals.liquidity}%`}} /></div>
            </AnimatedItem>
            <AnimatedItem className="ql-signal-card">
              <div className="ql-signal-header">
                <h3>APY Stability</h3>
                <span className={`ql-signal-score ql-grade-${signals.stability >= 85 ? 'a' : signals.stability >= 72 ? 'b' : signals.stability >= 60 ? 'c' : signals.stability >= 45 ? 'd' : 'f'}`}>
                  {signals.stability}
                </span>
              </div>
              <div className="ql-signal-bar"><div className="ql-signal-fill" style={{width: `${signals.stability}%`}} /></div>
            </AnimatedItem>
            <AnimatedItem className="ql-signal-card">
              <div className="ql-signal-header">
                <h3>Reward Quality</h3>
                <span className={`ql-signal-score ql-grade-${signals.sustainability >= 85 ? 'a' : signals.sustainability >= 72 ? 'b' : signals.sustainability >= 60 ? 'c' : signals.sustainability >= 45 ? 'd' : 'f'}`}>
                  {signals.sustainability}
                </span>
              </div>
              <div className="ql-signal-bar"><div className="ql-signal-fill" style={{width: `${signals.sustainability}%`}} /></div>
            </AnimatedItem>
            <AnimatedItem className="ql-signal-card">
              <div className="ql-signal-header">
                <h3>Data Completeness</h3>
                <span className={`ql-signal-score ql-grade-${signals.completeness >= 85 ? 'a' : signals.completeness >= 72 ? 'b' : signals.completeness >= 60 ? 'c' : signals.completeness >= 45 ? 'd' : 'f'}`}>
                  {signals.completeness}
                </span>
              </div>
              <div className="ql-signal-bar"><div className="ql-signal-fill" style={{width: `${signals.completeness}%`}} /></div>
            </AnimatedItem>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-section ql-section--tight">
        <div className="ql-wrap ql-intel">
          <div>
            <span className="ql-eyebrow">Assessment Summary</span>
            <h2 className="ql-h2">{grade.summary}</h2>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-section ql-section--tight">
        <div className="ql-wrap ql-intel">
          <div>
            <span className="ql-eyebrow">Key Observations</span>
            <h2 className="ql-h2">Strengths & Watchpoints</h2>
          </div>
          <div className="ql-observations-grid">
            <AnimatedItem className="ql-observation-card ql-observation-strengths">
              <h3>Strengths</h3>
              <ul>
                {strengths.map((s, i) => <li key={i}><Check size={16} strokeWidth={3} />{s}</li>)}
              </ul>
            </AnimatedItem>
            <AnimatedItem className="ql-observation-card ql-observation-watchpoints">
              <h3>Watchpoints</h3>
              <ul>
                {watchpoints.map((w, i) => <li key={i}><Check size={16} strokeWidth={3} />{w}</li>)}
              </ul>
            </AnimatedItem>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-section ql-section--tight">
        <div className="ql-wrap ql-intel">
          <div>
            <span className="ql-eyebrow">Methodology</span>
            <h2 className="ql-h2">Published & deterministic</h2>
            <p className="ql-lead">
              This assessment uses <Link href="/docs" className="ql-link">Litmus Methodology {methodologyVersion}</Link> — 
              four signals, published weights, fixed thresholds. The same inputs always produce the same output.
            </p>
          </div>
          <AnimatedItem className="ql-assurance">
            <ShieldCheck size={20} strokeWidth={3} />
            <p><strong>Critical promise:</strong> Payment does not influence the resulting grade.</p>
          </AnimatedItem>
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">Verification</span>
            <h2 className="ql-h2">Publicly verifiable record</h2>
          </div>
          <div className="ql-verification-card">
            <p>This assessment is permanently recorded in Litmus's weekly snapshot ({date}) and cannot be edited after publication.</p>
            <div className="ql-verification-meta">
              <div><strong>Protocol:</strong> {protocol}</div>
              <div><strong>Pool:</strong> {poolName}</div>
              <div><strong>Chain:</strong> {chain}</div>
              <div><strong>Assessment Date:</strong> {formatDate(date)}</div>
              <div><strong>Methodology Version:</strong> {methodologyVersion}</div>
              <div><strong>Grade:</strong> {grade.letter} ({grade.score}/100)</div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">Disclaimer</span>
            <h2 className="ql-h2">Limitations</h2>
          </div>
          <div className="ql-disclaimer">
            <p>
              This assessment reflects the pool's performance against Litmus's published methodology. 
              It is not investment advice, an endorsement, safety certification, or a guarantee of future performance.
            </p>
            <p>
              An A–F grade represents methodology performance, not an absolute judgment of whether a protocol is safe or legitimate.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <MarketingFooter />
      </main>
    </>
  )
}
