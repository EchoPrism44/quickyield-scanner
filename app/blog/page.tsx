import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'
import { getAllPosts } from '../../lib/blog'

export const metadata: Metadata = {
  title: 'Research — the weekly grade record, analyzed',
  description:
    'Weekly analysis of the Litmus grade record: which pools upgraded, which downgraded, and what it says about onchain yield right now.',
  alternates: { canonical: '/blog' },
}

export const dynamic = 'force-static'

export default function BlogIndexPage() {
  const posts = getAllPosts()
  const [lead, ...rest] = posts

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <div className="ql-wrap">
        <header className="ql-blog-masthead">
          <span className="ql-eyebrow">Research</span>
          <h1>The record, analyzed.</h1>
          <p>
            Every Monday we grade every live pool and publish the record. Here we read it —
            upgrades, downgrades, and what moved in onchain yield this week.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="ql-lead" style={{ paddingBlock: 'var(--sp-7)' }}>First report coming soon.</p>
        ) : (
          <div className="ql-blog-list">
            {lead && (
              <Link href={`/blog/${lead.slug}`} className="ql-blog-item ql-blog-item--lead">
                <div className="ql-blog-meta">
                  <span>{lead.date}</span>
                  <span className="sep">·</span>
                  <span className="byline">{lead.author}</span>
                  <span className="sep">·</span>
                  <span>{lead.readMinutes} min read</span>
                </div>
                <h2>{lead.title}</h2>
                <p>{lead.excerpt}</p>
              </Link>
            )}

            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="ql-blog-item">
                <div className="ql-blog-meta">
                  <span>{post.date}</span>
                  <span className="sep">·</span>
                  <span className="byline">{post.author}</span>
                  <span className="sep">·</span>
                  <span>{post.readMinutes} min read</span>
                </div>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <MarketingFooter />
    </main>
  )
}
