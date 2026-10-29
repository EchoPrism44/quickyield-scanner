import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'
import { getAllPosts } from '../../lib/blog'

export const metadata: Metadata = {
  title: 'Crypto News & DeFi Research',
  description: 'Crypto news, DeFi reporting, digital asset markets, regulation, and independent onchain research from Litmus.',
  alternates: { canonical: '/blog' },
}

export const dynamic = 'force-static'

const categories = [
  { label: 'All stories', href: '/blog' },
  { label: 'DeFi', href: '/blog/category/defi' },
  { label: 'Markets', href: '/blog/category/markets' },
  { label: 'Security', href: '/blog/category/security' },
  { label: 'Policy & regulation', href: '/blog/category/regulation' },
  { label: 'Research & guides', href: '/blog/category/research' },
]

export default function BlogIndexPage() {
  const posts = getAllPosts().filter((post) => !post.noindex)
  const [lead, ...rest] = posts

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />
      <div className="ql-wrap">
        <header className="ql-blog-masthead">
          <span className="ql-eyebrow">Litmus newsroom</span>
          <h1>Crypto, explained.</h1>
          <p>Independent reporting and research on digital assets, DeFi, markets, regulation, and onchain risk. Facts first, hype questioned.</p>
        </header>
        <nav className="ql-news-category-nav" aria-label="Filter stories by category">
          {categories.map((category) => (
            <Link key={category.href} href={category.href} className={category.href === '/blog' ? 'is-active' : ''}>{category.label}</Link>
          ))}
        </nav>
        {posts.length === 0 ? (
          <p className="ql-lead" style={{ paddingBlock: 'var(--sp-7)' }}>New reporting coming soon.</p>
        ) : (
          <div className="ql-blog-list">
            {lead && (
              <Link href={`/blog/${lead.slug}`} className="ql-blog-item ql-blog-item--lead">
                <div className="ql-blog-meta"><span>{lead.category}</span><span className="sep">·</span><time dateTime={lead.date}>{lead.date}</time><span className="sep">·</span><span className="byline">{lead.author}</span><span className="sep">·</span><span>{lead.readMinutes} min read</span></div>
                <h2>{lead.title}</h2>
                <p>{lead.excerpt || lead.description}</p>
              </Link>
            )}
            {rest.map((post) => (
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
