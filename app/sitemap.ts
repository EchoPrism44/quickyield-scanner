import type { MetadataRoute } from 'next'
import { getAllPosts } from '../lib/blog'
import { getPublishedAssessments } from '../lib/store'

// Keep the sitemap on Litmus's single canonical public origin.
const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.getlitmus.xyz'

const assets = ['usdc', 'usdt', 'dai', 'eth', 'steth', 'sol']
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const reports = await getPublishedAssessments()
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/yields`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/yields/rwa`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    ...assets.map((a) => ({ url: `${base}/yields/${a}`, lastModified: now, changeFrequency: 'hourly' as const, priority: 0.7 })),
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/assessments`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/reports`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ...reports.map((report) => ({ url: `${base}/assessments/${report.slug}`, lastModified: new Date(report.publishedAt ?? report.assessedAt), changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...getAllPosts()
      .filter((p) => !p.noindex)
      .map((p) => ({
        url: p.canonical || `${base}/blog/${p.slug}`,
        lastModified: new Date(p.updated || p.date),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}