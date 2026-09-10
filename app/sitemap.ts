import type { MetadataRoute } from 'next'
import { getAllPosts } from '../lib/blog'
import { getPublishedAssessments } from '../lib/store'

// Keep the sitemap on Litmus's single canonical public origin.
const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.getlitmus.xyz'

export const revalidate = 3600

const assets = ['usdc', 'usdt', 'dai', 'eth', 'steth', 'sol']
async function loadPublishedReports() {
  try {
    return await Promise.race([
      getPublishedAssessments(),
      new Promise<Awaited<ReturnType<typeof getPublishedAssessments>>>((resolve) => setTimeout(() => resolve([]), 2500)),
    ])
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const reports = await loadPublishedReports()
  const urls = [
    `${base}/`,
    `${base}/yields`,
    `${base}/yields/rwa`,
    ...assets.map((a) => `${base}/yields/${a}`),
    `${base}/blog`,
    `${base}/assessments`,
    `${base}/reports`,
    ...reports.map((report) => `${base}/assessments/${report.slug}`),
    ...getAllPosts()
      .filter((p) => !p.noindex)
      .map((p) => p.canonical || `${base}/blog/${p.slug}`),
    `${base}/legal/terms`,
    `${base}/legal/privacy`,
    `${base}/legal/disclaimer`,
  ]
  return urls.map((url) => ({ url }))
}
