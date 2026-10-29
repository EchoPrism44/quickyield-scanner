import type { MetadataRoute } from 'next'
import { getAllPosts } from '../lib/blog'

// Public sitemap contains editorial pages only; legacy product surfaces redirect to newsroom routes.
const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.getlitmus.xyz'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

const categories = ['defi', 'markets', 'security', 'regulation', 'research']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = [
    `${base}/`,
    `${base}/blog`,
    `${base}/about`,
    ...categories.map((category) => `${base}/blog/category/${category}`),
    ...getAllPosts()
      .filter((post) => !post.noindex)
      .map((post) => post.canonical || `${base}/blog/${post.slug}`),
    `${base}/legal/terms`,
    `${base}/legal/privacy`,
    `${base}/legal/disclaimer`,
  ]
  return urls.map((url) => ({ url }))
}
