import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarketingNav } from '../../../../components/marketing-nav'
import { MarketingFooter } from '../../../../components/marketing/marketing-footer'
import { getAllPosts } from '../../../../lib/blog'

const categories: Record<string, { title: string; description: string; match: string[] }> = {
  defi: { title: 'DeFi', description: 'Protocol developments, liquidity, yields, stablecoins, governance, and onchain risk.', match: ['defi'] },
  markets: { title: 'Markets', description: 'Digital asset markets, Bitcoin, Ethereum, market structure, and trading activity.', match: ['markets', 'market'] },
  regulation: { title: 'Policy & Regulation', description: 'The laws, institutions, and policy decisions shaping digital assets.', match: ['regulation', 'policy'] },
  security: { title: 'Security', description: 'Crypto exploits, vulnerabilities, infrastructure incidents, and practical security updates.', match: ['security'] },
  research: { title: 'Research & Guides', description: 'Evergreen explainers and deeper analysis to help readers understand crypto and DeFi.', match: ['research', 'guide', 'analysis'] },
}

export function generateStaticParams() {
  return Object.keys(categories).map((category) => ({ category }))
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const item = categories[category]
  if (!item) return {}
  return {
    title: `${item.title} News & Analysis`,
    description: item.description,
    alternates: { canonical: `/blog/category/${category}` },
  }
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const item = categories[category]
  if (!item) notFound()
  const posts = getAllPosts().filter((post) => !post.noindex && item.match.includes(post.category.toLowerCase()))
  const tabs = [
    { label: 'All stories', href: '/blog' },
    { label: 'DeFi', href: '/blog/category/defi' },
    { label: 'Markets', href: '/blog/category/markets' },
    { label: 'Security', href: '/blog/category/security' },
    { label: 'Policy & regulation', href: '/blog/category/regulation' },
    { label: 'Research & guides', href: '/blog/category/research' },
  ]

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />
      <div className="ql-wrap">
        <header className="ql-blog-masthead">
          <span className="ql-eyebrow">Coverage / {item.title}</span>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
        </header>
        <nav className="ql-news-category-nav" aria-label="Browse story categories">
          {tabs.map((tab) => <Link key={tab.href} href={tab.href} className={tab.href === `/blog/category/${category}` ? 'is-active' : ''}>{tab.label}</Link>)}
        </nav>
        {posts.length === 0 ? (
          <div className="ql-news-empty">
            <h2>More coverage is on the way.</h2>
            <p>There are no published stories in this section yet. Browse all Litmus reporting and research in the meantime.</p>
            <Link href="/blog" className="ql-text-link">View all stories →</Link>
          </div>
        ) : (
          <div className="ql-blog-list">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="ql-blog-item">
                <div className="ql-blog-meta"><span>{post.category}</span><span className="sep">·</span><time dateTime={post.date}>{post.date}</time><span className="sep">·</span><span className="byline">{post.author}</span><span className="sep">·</span><span>{post.readMinutes} min read</span></div>
                <h2>{post.title}</h2>
                <p>{post.excerpt || post.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <MarketingFooter />
    </main>
  )
}
