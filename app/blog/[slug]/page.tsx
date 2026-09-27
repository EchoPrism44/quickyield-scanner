import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarketingNav } from '../../../components/marketing-nav'
import { MarketingFooter } from '../../../components/marketing/marketing-footer'
import { getAllPosts, getRelatedPosts, getPost } from '../../../lib/blog'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return getAllPosts().filter((post) => !post.noindex).map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}

  const canonical = post.canonical || `/blog/${post.slug}`
  const metadata: Metadata = {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [post.author],
      ...(post.ogImage ? { images: [{ url: post.ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      ...(post.ogImage ? { images: [post.ogImage] } : {}),
    },
  }
  if (post.noindex) metadata.robots = { index: false, follow: false }
  return metadata
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()
  const related = getRelatedPosts(post)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://getlitmus.xyz')
  const canonicalUrl = post.canonical || `${siteUrl}/blog/${post.slug}`

  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: 'Litmus', url: siteUrl },
    mainEntityOfPage: canonicalUrl,
    ...(post.ogImage ? { image: [post.ogImage] } : {}),
  }

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <div className="ql-wrap">
        <article className="ql-article">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }} />
          <Link href="/blog" className="ql-article-back">
            <ArrowLeft size={13} /> All research
          </Link>

          <div className="ql-article-kicker">
            <span className="ql-eyebrow">{post.category}</span>
          </div>
          <h1>{post.title}</h1>
          {post.description ? <p className="ql-article-standfirst">{post.description}</p> : null}

          <div className="ql-article-byline">
            <span className="byline">By {post.author}</span>
            <span className="sep">·</span>
            <time dateTime={post.date}>{post.date}</time>
            {post.updated !== post.date ? <><span className="sep">·</span><span>Updated {post.updated}</span></> : null}
            <span className="sep">·</span>
            <span>{post.readMinutes} min read</span>
          </div>

          {post.tags.length > 0 ? (
            <div className="ql-article-tags" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'var(--sp-3)' }}>
              {post.tags.map((tag) => <span key={tag} className="ql-eyebrow">{tag}</span>)}
            </div>
          ) : null}

          <div className="ql-article-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
          </div>

          {post.snapshot ? (
            <p style={{ marginTop: 'var(--sp-5)' }}>
              <Link href={`/proof/${post.snapshot}`}>View the underlying Litmus snapshot →</Link>
            </p>
          ) : null}

          {related.length > 0 ? (
            <section aria-labelledby="related-research" style={{ marginTop: 'var(--sp-7)' }}>
              <h2 id="related-research">Related research</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {related.map((item) => (
                  <Link key={item.slug} href={`/blog/${item.slug}`}>
                    <strong>{item.title}</strong>
                    <span style={{ display: 'block', opacity: 0.7 }}>{item.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <div className="ql-disclaimer" style={{ marginTop: 'var(--sp-7)' }}>
            <span>
              Safety Grades are our opinion under a published methodology. Informational only —
              not investment advice, not an audit, and not a guarantee.
            </span>
          </div>
        </article>
      </div>

      <MarketingFooter />
    </main>
  )
}
