import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'

export const metadata: Metadata = {
  title: 'About & Editorial Standards',
  description: 'Learn about Litmus, our editorial principles, independence, sourcing standards, and corrections policy.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />
      <article className="ql-wrap ql-article ql-about-page">
        <span className="ql-eyebrow">About Litmus</span>
        <h1>Independent crypto journalism. Evidence over hype.</h1>
        <p className="ql-article-standfirst">
          Litmus covers digital assets, decentralised finance, markets, regulation, and onchain
          developments. Our goal is to explain what happened, why it matters, and what the available
          evidence can actually support.
        </p>
        <section id="standards">
          <h2>Editorial standards</h2>
          <p>We aim to distinguish confirmed facts, attributed claims, and our own analysis. We link to primary sources where possible, including protocol announcements, governance proposals, regulatory documents, and onchain data.</p>
          <p>We do not treat token prices, projected returns, protocol claims, or social media posts as proof on their own. Where information is incomplete or disputed, our coverage should say so.</p>
        </section>
        <section id="independence">
          <h2>Independence and conflicts</h2>
          <p>Commercial relationships should not determine our reporting or conclusions. Any sponsored or paid placement must be clearly labelled. Receiving payment from a project must never be presented as independent editorial endorsement.</p>
        </section>
        <section id="sources">
          <h2>Sources and verification</h2>
          <p>We prioritise primary documents and direct data, then use reputable secondary reporting for context. Material allegations require careful attribution and corroboration. Onchain data can provide evidence of transactions and balances, but it does not automatically establish intent or identify the people behind an address.</p>
        </section>
        <section id="corrections">
          <h2>Corrections policy</h2>
          <p>If a published story contains a material error, we aim to correct it promptly and make significant corrections clear to readers. Updates that materially change a story should be reflected in the article's update information.</p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>For corrections, source material, or editorial enquiries, please use the site's available contact channels. We will publish direct newsroom contact details when they are configured.</p>
        </section>
        <p><Link href="/blog" className="ql-text-link">Explore our coverage →</Link></p>
      </article>
      <MarketingFooter />
    </main>
  )
}
