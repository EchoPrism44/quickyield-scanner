import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'
import { getPublishedPosts } from '../../lib/wordpress'

export const metadata: Metadata = {
  title: 'News & Research — Litmus',
  description:
    'Independent reporting, analysis and research on crypto markets, protocols and digital assets.',
  alternates: { canonical: '/blog' },
}

export const dynamic = 'force-static'

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts()
  const [lead, ...rest] = posts

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <div className="ql-wrap">
        <header className="ql-blog-masthead">
          <span className="ql-eyebrow">News &amp; Research</span>
          <h1>The latest from digital assets.</h1>
          <p>
            Reporting, analysis and research on crypto markets, protocols and the technology shaping them.
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
