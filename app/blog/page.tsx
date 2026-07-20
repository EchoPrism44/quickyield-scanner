import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'
import { getAllPosts } from '../../lib/blog'

export const metadata: Metadata = {
  title: 'Blog — the weekly grade record, analyzed',
  description:
    'Weekly analysis of the QuickYield grade record: which pools upgraded, which downgraded, and what it says about onchain yield right now.',
  alternates: { canonical: '/blog' },
}

export const dynamic = 'force-static'

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <div className="ql-wrap">
        <div className="ql-proof-hero">
          <span className="ql-eyebrow">Build in public</span>
          <h1 className="ql-h2" style={{ marginTop: 'var(--sp-4)' }}>The record, analyzed.</h1>
          <p className="ql-lead">
            Every Monday we grade every live pool and publish the record. Here we read it —
            upgrades, downgrades, and what moved in onchain yield this week.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="ql-lead" style={{ paddingBottom: 'var(--sp-8)' }}>First post coming soon.</p>
        ) : (
          <div className="ql-blog-list">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="ql-blog-card">
                <div className="ql-blog-card-meta">
                  <span className="ql-eyebrow">{post.date}</span>
                  <span className="ql-blog-read">By {post.author}</span>
                  <span className="ql-blog-read">{post.readMinutes} min read</span>
                </div>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <span className="ql-blog-more">Read <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <MarketingFooter />
    </main>
  )
}
