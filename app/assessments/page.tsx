import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'
import { AnimatedSection } from '../../components/marketing/animated-section'
import { AnimatedItem } from '../../components/marketing/animated-item'

export const metadata: Metadata = {
  title: 'Independent DeFi Yield Pool Assessments | Litmus',
  description: 'Quantitative A–F assessments for DeFi yield pools. Independent methodology, transparent signals, public verification. $200 per pool.',
  openGraph: {
    title: 'Independent DeFi Yield Pool Assessments | Litmus',
    description: 'Quantitative A–F assessments for DeFi yield pools with public verification.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Independent DeFi Yield Pool Assessments | Litmus',
    description: 'Quantitative A–F assessments for DeFi yield pools.',
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Litmus Independent Protocol Assessment',
      description: 'Independent quantitative A–F assessments for DeFi yield pools using published methodology.',
      provider: {
        '@type': 'Organization',
        name: 'Litmus',
        url: 'https://getlitmus.xyz',
      },
      offers: [
        {
          '@type': 'Offer',
          name: 'One Pool Assessment',
          price: '200',
          priceCurrency: 'USD',
          description: 'A–F grade, signal breakdown, historical analysis, public page, badge',
        },
        {
          '@type': 'Offer',
          name: 'Three Pool Assessment',
          price: '500',
          priceCurrency: 'USD',
          description: 'Up to 3 pools, individual reports, shared analysis, bulk badges',
        },
      ],
    }),
  },
}

const benefits = [
  'A–F grade with quantitative signal breakdown',
  'Historical analysis of TVL, APY, and signal trends',
  'Public assessment page at getlitmus.xyz/assessments/[pool]',
  'Litmus Assessed badge for your UI/website',
  'Permanent record in our weekly snapshot',
]

const threePoolBenefits = [
  'Assess up to 3 pools at once',
  'Individual grade reports for each',
  'Shared historical analysis section',
  'Bulk badge codes',
]

export default function AssessmentsPage() {
  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <section className="ql-hero">
        <div className="ql-hero-aurora" aria-hidden="true" />
        <div className="ql-wrap ql-hero-body">
          <div>
            <span className="ql-badge">
              <span className="ql-dot" />
              Independent DeFi Pool Assessments
            </span>
            <h1 className="ql-h1">
              Quantitative A–F grading for protocols
            </h1>
            <p className="ql-hero-sub">
              Litmus provides independent quantitative assessments of DeFi yield pools using a published A–F methodology. 
              Every assessment is deterministic: the same inputs always produce the same output, regardless of payment.
            </p>
            <Link href="#contact" className="ql-btn ql-btn--primary">
              Request an Assessment
            </Link>
          </div>
          <div className="ql-assessment-preview">
            <div className="ql-grade-badge">B</div>
            <div className="ql-preview-text">
              <strong>Example Protocol — USDC Pool</strong>
              <span>Assessed Sep 7, 2026 · Litmus v1.0</span>
              <span className="ql-meta">Liquidity 84 · Stability 72 · Sustainability 81 · Completeness 91</span>
            </div>
          </div>
        </div>
      </section>

      <AnimatedSection className="ql-section ql-section--tight" id="offering">
        <div className="ql-wrap ql-intel">
          <div>
            <span className="ql-eyebrow">What you receive</span>
            <h2 className="ql-h2">Two assessment tiers</h2>
            <p className="ql-lead">
              Transparent pricing. No hidden fees. The grade is always computed from the same published methodology.
            </p>
          </div>
          <div className="ql-assessments-grid">
            <AnimatedItem className="ql-assessment-card" hoverLift>
              <h3>One Pool</h3>
              <p className="ql-price">$200</p>
              <ul>
                {benefits.map((b) => <li key={b}><Check size={16} strokeWidth={3} />{b}</li>)}
              </ul>
            </AnimatedItem>
            <AnimatedItem className="ql-assessment-card" hoverLift>
              <h3>Three Pools</h3>
              <p className="ql-price">$500</p>
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
            <h2 className="ql-h2">Published, deterministic, defensible</h2>
            <p className="ql-lead">
              Every assessment uses Litmus's published A–F methodology with four defined signals:
            </p>
            <ul className="ql-intel-list">
              <li><strong>Liquidity</strong> — pool depth and depth stability</li>
              <li><strong>APY Stability</strong> — yield variance over time</li>
              <li><strong>Reward Quality</strong> — token emission sustainability</li>
              <li><strong>Data Completeness</strong> — data source reliability and coverage</li>
            </ul>
            <p className="ql-lead" style={{marginTop: '1rem'}}>
              Each signal is scored 0–100, weighted exactly as published, distilled into one letter grade with a weakest-factor summary.
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
          <div className="ql-contact-card">
            <p>We'll need your pool address/ID and chain. Assessment delivery: 3–5 business days.</p>
            <Link href="mailto:echo@litmus.xyz?subject=Assessment%20Request%20-%20%5BProtocol%20Name%5D&body=Protocol%20Name%3A%20%0D%0APool%20Address%2FID%3A%20%0D%0AChain%3A%20%0D%0AContact%20Name%3A%20%0D%0A%0D%0AWe%27re%20interested%20in%20an%20independent%20A%E2%80%93F%20assessment%20for%20our%20yield%20pool." className="ql-btn ql-btn--primary">
              Request an Assessment
            </Link>
          </div>
        </div>
      </AnimatedSection>

      <MarketingFooter />
    </main>
  )
}