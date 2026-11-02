import { getAllPosts, type BlogPost } from './blog'

type WpPost = {
  slug: string; date: string; modified: string
  title: { rendered: string }; excerpt?: { rendered: string }
  content?: { rendered: string }
  _embedded?: {
    author?: Array<{ name?: string }>
    'wp:term'?: Array<Array<{ name?: string; taxonomy?: string }>>
    'wp:featuredmedia'?: Array<{ source_url?: string }>
  }
}

function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—')
    .replace(/&hellip;/g, '…').replace(/\s+/g, ' ').trim()
}

function mapPost(post: WpPost): BlogPost | null {
  if (!post.slug || !/^[\w-]+$/.test(post.slug) || !post.title?.rendered || !post.date) return null
  const terms = (post._embedded?.['wp:term'] ?? []).flat()
  const categories = terms.filter((term) => term.taxonomy === 'category').map((term) => term.name).filter(Boolean)
  const html = post.content?.rendered ?? ''
  const words = plainText(html).split(/\s+/).filter(Boolean).length
  const date = post.date.slice(0, 10)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.getlitmus.xyz'
  return {
    slug: post.slug, title: plainText(post.title.rendered),
    description: plainText(post.excerpt?.rendered ?? ''),
    excerpt: plainText(post.excerpt?.rendered ?? ''),
    date, updated: post.modified?.slice(0, 10) || date,
    author: post._embedded?.author?.[0]?.name || 'Litmus Research',
    category: categories[0] || 'News',
    tags: terms.filter((term) => term.taxonomy === 'post_tag').map((term) => term.name).filter((v): v is string => Boolean(v)),
    canonical: siteUrl.replace(/\/$/, '') + '/blog/' + post.slug,
    ogImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
    noindex: false, readMinutes: Math.max(1, Math.ceil(words / 200)),
    snapshot: '', related: [], contentType: 'news', body: html, contentHtml: html,
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const site = process.env.WORDPRESS_SITE_URL?.trim()
  if (!site) return getAllPosts()
  try {
    const url = new URL(site.replace(/\/$/, '') + '/wp-json/wp/v2/posts')
    url.searchParams.set('per_page', '100')
    url.searchParams.set('orderby', 'date')
    url.searchParams.set('order', 'desc')
    url.searchParams.set('_embed', '1')
    const response = await fetch(url, { next: { revalidate: 300 } })
    if (!response.ok) throw new Error('WordPress API returned ' + response.status)
    const posts = await response.json() as WpPost[]
    return posts.map(mapPost).filter((post): post is BlogPost => post !== null)
  } catch (error) {
    console.error('[Litmus CMS] WordPress fetch failed; using Markdown fallback.', error)
    return getAllPosts()
  }
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  if (!/^[\w-]+$/.test(slug)) return null
  return (await getPublishedPosts()).find((post) => post.slug === slug) ?? null
}

export async function getRelatedPublishedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  return (await getPublishedPosts())
    .filter((candidate) => candidate.slug !== post.slug && !candidate.noindex)
    .map((candidate) => ({
      candidate,
      score: candidate.tags.filter((tag) => post.tags.includes(tag)).length + (candidate.category === post.category ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.candidate.date.localeCompare(a.candidate.date))
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}
