import { Metadata } from 'next'
import Link from 'next/link'
import { Check, ShieldCheck } from 'lucide-react'
import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'
import { AnimatedSection } from '../../components/marketing/animated-section'
import { AnimatedItem } from '../../components/marketing/animated-item'
import { AssessmentRequestForm } from '../../components/assessment-request-form'

export const metadata: Metadata = {
  title: 'Independent DeFi Yield Pool Assessments | Litmus',
  description: 'Independent Yield Pool Assessments for live DeFi pools. Fixed methodology, public publication, and factual review. Founding cohort from $500.',
  openGraph: {
    title: 'Independent DeFi Yield Pool Assessments | Litmus',
    description: 'Quantitative A–F assessments for DeFi yield pools with public verification.',
    type: 'website',
    url: '/assessments',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Independent DeFi Yield Pool Assessments | Litmus',
    description: 'Quantitative A–F assessments for DeFi yield pools.',
  },
  alternates: {
    canonical: '/assessments',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Litmus Yield Pool Assessment',
  description: 'Independent quantitative assessments for live DeFi yield pools using a published methodology.',
  url: 'https://www.getlitmus.xyz/assessments',
  serviceType: 'DeFi yield pool assessment',
  provider: {
    '@type': 'Organization',
    '@id': 'https://www.getlitmus.xyz/#organization',
    name: 'Litmus',
    url: 'https://www.getlitmus.xyz',
  },
  areaServed: 'Worldwide',
  offers: [
    {
      '@type': 'Offer',
      name: 'One Pool Assessment',
      price: '500',
      priceCurrency: 'USD',
      description: 'A–F grade, signal breakdown, historical analysis, public page, badge',
      url: 'https://www.getlitmus.xyz/assessments#contact',
    },
    {
      '@type': 'Offer',
      name: 'Three Pool Assessment',
      price: '1200',
      priceCurrency: 'USD',
      description: 'Up to 3 pools, individual reports, shared analysis, bulk badges',
      url: 'https://www.getlitmus.xyz/assessments#contact',
    },
  ],
}

const benefits = [
  'A–F grade with quantitative signal breakdown',
  'Historical analysis of TVL, APY, and signal trends',
  'Public report after a seven-day factual review',
  'Evidence-linked methodology summary',
  'Permanent public record on Litmus',
]

const threePoolBenefits = [
  'Assess up to 3 pools at once',
  'Individual grade reports for each',
  'Shared historical analysis section',
  'Shared report context and comparison',
]

export default function AssessmentsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <section className="ql-hero">
        <div className="ql-hero-aurora" aria-hidden="true" />
        <div className="ql-wrap ql-hero-body">
          <div>
            <span className="ql-badge">
              <span className="ql-dot" />
              Independent Yield Pool Assessments
            </span>
            <h1 className="ql-h1">
              A clear public read on your live yield pool
            </h1>
            <p className="ql-hero-sub">
              Litmus evaluates live DeFi yield pools with enough history to measure liquidity, APY stability, reward quality, and data completeness. The grade is computed independently and published after factual review.
            </p>
            <Link href="#contact" className="ql-btn ql-btn--primary">
              Request an Assessment
            </Link>
          </div>
          <div className="ql-assessment-preview">
            <div className="ql-grade-badge">B</div>
            <div className="ql-preview-text">
              <strong>Example Protocol · USDC Pool</strong>
              <span>Public report · Litmus v1.0</span>
              <span className="ql-meta">Liquidity 84 · Stability 72 · Sustainability 81 · Completeness 91</span>
            </div>
          </div>
        </div>
      </section>

      <AnimatedSection className="ql-section ql-section--tight" id="offering">
        <div className="ql-wrap ql-intel">
          <div>
            <span className="ql-eyebrow">What you receive</span>
            <h2 className="ql-h2">Founding cohort pricing</h2>
            <p className="ql-lead">
              Payment covers research time and report depth. It never buys a grade, approval, or removal from the public record.
            </p>
          </div>
          <div className="ql-assessments-grid">
            <AnimatedItem className="ql-assessment-card" hoverLift>
              <h3>One Pool</h3>
              <p className="ql-price">$500</p>
              <ul>
                {benefits.map((b) => <li key={b}><Check size={16} strokeWidth={3} />{b}</li>)}
              </ul>
            </AnimatedItem>
            <AnimatedItem className="ql-assessment-card" hoverLift>
              <h3>Three Pools</h3>
              <p className="ql-price">$1,200</p>
              <ul>
                {threePoolBenefits.map((b) => <li key={b}><Check size={16} strokeWidth={3} />{b}</li>)}
              </ul>
            </AnimatedItem>
          </div>
          <AnimatedItem className="ql-assurance" hoverLift>
            <ShieldCheck size={20} strokeWidth={3} />
            <p><strong>Critical promise:</strong> Payment does not influence the resulting grade.</p>
          </AnimatedItem>
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-section ql-section--tight" id="methodology">
        <div className="ql-wrap ql-intel">
          <div>
            <span className="ql-eyebrow">Methodology</span>
              <h2 className="ql-h2">Built for live pools with real history</h2>
            <p className="ql-lead">
              We currently accept DeFiLlama-listed pools with at least $1M TVL and 30 days of available history:
            </p>
            <ul className="ql-intel-list">
              <li><strong>Liquidity</strong>  -  pool depth and depth stability</li>
              <li><strong>APY Stability</strong>  -  yield variance over time</li>
              <li><strong>Reward Quality</strong>  -  token emission sustainability</li>
              <li><strong>Data Completeness</strong>  -  data source reliability and coverage</li>
            </ul>
            <p className="ql-lead" style={{marginTop: '1rem'}}>
              Each signal is scored 0–100, weighted exactly as published, and distilled into one letter grade. Every completed report is published after a seven-day factual-correction window.
              <Link href="/docs" className="ql-link">View full methodology →</Link>
            </p>
          </div>
          <AnimatedItem className="ql-scorecard">
            <div className="ql-grade-badge">B</div>
            <div>
              <h4>What a grade is made of</h4>
              <p>Signal weights · from the model</p>
            </div>
          </AnimatedItem>
        </div>
      </AnimatedSection>

      <AnimatedSection className="ql-section ql-section--tight" id="contact">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">Get assessed</span>
            <h2 className="ql-h2">Request an independent assessment</h2>
          </div>
          <AssessmentRequestForm />
        </div>
      </AnimatedSection>

      <MarketingFooter />
      </main>
    </>
  )
}