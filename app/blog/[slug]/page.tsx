import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarketingNav } from '../../../components/marketing-nav'
import { MarketingFooter } from '../../../components/marketing/marketing-footer'
import { getAllPosts, getPost } from '../../../lib/blog'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />

      <div className="ql-wrap">
        <article className="ql-article">
          <Link href="/blog" className="ql-article-back">
            <ArrowLeft size={14} /> All posts
          </Link>
          <div className="ql-blog-card-meta" style={{ marginTop: 'var(--sp-5)' }}>
            <span className="ql-eyebrow">{post.date}</span>
            <span className="ql-blog-read">{post.readMinutes} min read</span>
          </div>
          <h1>{post.title}</h1>
          <div className="ql-article-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
          </div>
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
