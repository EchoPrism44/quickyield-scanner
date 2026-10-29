import Link from 'next/link'
import { ArrowUpRight, BookOpen, ChartNoAxesCombined, Landmark, ShieldAlert } from 'lucide-react'
import { MarketingNav } from '../components/marketing-nav'
import { MarketingFooter } from '../components/marketing/marketing-footer'
import { getAllPosts } from '../lib/blog'

export const revalidate = 1800

const coverage = [
  {
    icon: ChartNoAxesCombined,
    title: 'Markets',
    description: 'Bitcoin, Ethereum, digital assets, and the forces moving crypto markets.',
    href: '/blog?category=markets',
  },
  {
    icon: ShieldAlert,
    title: 'DeFi',
    description: 'Protocol developments, exploits, liquidity, stablecoins, and onchain risk.',
    href: '/blog?category=defi',
  },
  {
    icon: Landmark,
    title: 'Policy & Regulation',
    description: 'The laws, institutions, and policy decisions shaping digital assets.',
    href: '/blog?category=regulation',
  },
]

export default function HomePage() {
  const posts = getAllPosts().filter((post) => !post.noindex)
  const [lead, ...rest] = posts

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <section className="ql-hero">
        <div className="ql-hero-aurora" aria-hidden="true" />
        <div className="ql-wrap ql-hero-body">
          <div>
            <span className="ql-badge"><span className="ql-dot" /> Independent crypto journalism</span>
            <h1 className="ql-h1">Crypto, without the <em>noise.</em></h1>
            <p className="ql-hero-sub">
              Independent reporting and research on digital assets, DeFi, markets, and the
              technology reshaping finance. Facts first. Incentives disclosed. Hype questioned.
            </p>
            <div className="ql-cta-row">
              <Link href="/blog" className="ql-btn ql-btn--primary">Read the latest</Link>
              <Link href="/about" className="ql-btn ql-btn--ghost">Our editorial standards</Link>
            </div>
            <div className="ql-proof">
              <span>News & analysis</span><span>Onchain research</span><span>Independent perspective</span>
            </div>
          </div>
          <div className="ql-news-brief">
            <span className="ql-eyebrow">Our focus</span>
            <h2>Follow the facts behind the market.</h2>
            <p>We look beyond price moves to the protocols, incentives, institutions, and risks that explain them.</p>
            <Link href="/blog" className="ql-text-link">Explore all coverage <ArrowUpRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="ql-section">
        <div className="ql-wrap">
          <div className="ql-head ql-news-section-head">
            <div>
              <span className="ql-eyebrow">Latest coverage</span>
              <h2 className="ql-h2">Reporting and research</h2>
            </div>
            <Link href="/blog" className="ql-text-link">All stories <ArrowUpRight size={15} /></Link>
          </div>

          {lead ? (
            <div className="ql-news-grid">
              <Link href={`/blog/${lead.slug}`} className="ql-news-feature">
                <div className="ql-news-feature-art" aria-hidden="true"><BookOpen size={34} strokeWidth={1.2} /></div>
                <div className="ql-blog-meta">
                  <span>{lead.category}</span><span className="sep">·</span><time dateTime={lead.date}>{lead.date}</time><span className="sep">·</span><span>{lead.readMinutes} min read</span>
                </div>
                <h3>{lead.title}</h3>
                <p>{lead.excerpt || lead.description}</p>
                <span className="ql-text-link">Read story <ArrowUpRight size={15} /></span>
              </Link>
              <div className="ql-news-list">
                {rest.slice(0, 5).map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="ql-news-row">
                    <div className="ql-blog-meta"><span>{post.category}</span><span className="sep">·</span><time dateTime={post.date}>{post.date}</time></div>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt || post.description}</p>
                    <span className="ql-news-read">{post.readMinutes} min read <ArrowUpRight size={13} /></span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="ql-news-empty">
              <BookOpen size={24} />
              <h3>Our newsroom is getting ready.</h3>
              <p>New reporting and analysis will appear here as stories are published.</p>
            </div>
          )}
        </div>
      </section>

      <section className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-head">
            <span className="ql-eyebrow">What we cover</span>
            <h2 className="ql-h2">The stories beneath the headlines.</h2>
          </div>
          <div className="ql-cards-3">
            {coverage.map((item) => (
              <Link href={item.href} className="ql-card ql-news-coverage-card" key={item.title}>
                <div className="ql-card-ic"><item.icon size={20} /></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="ql-text-link">Explore coverage <ArrowUpRight size={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="ql-section ql-section--tight">
        <div className="ql-wrap">
          <div className="ql-news-standards">
            <div>
              <span className="ql-eyebrow">Editorial principles</span>
              <h2 className="ql-h2">Trust is earned, not claimed.</h2>
            </div>
            <div className="ql-news-standards-points">
              <p><strong>Evidence over hype.</strong> We distinguish verified facts, claims, and analysis.</p>
              <p><strong>Independence.</strong> Commercial relationships should never dictate our conclusions.</p>
              <p><strong>Corrections matter.</strong> When we get something wrong, we aim to correct it clearly.</p>
            </div>
            <Link href="/about" className="ql-btn ql-btn--ghost">Read our standards</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
