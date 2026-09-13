import { getAllPosts } from '../../lib/blog'
import { getPublishedAssessments } from '../../lib/store'

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.getlitmus.xyz'
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

export const revalidate = 3600

export async function GET() {
  const reports = await loadPublishedReports()
  const urls = [
    `${base}/`,
    `${base}/yields`,
    `${base}/yields/rwa`,
    ...assets.map((asset) => `${base}/yields/${asset}`),
    `${base}/blog`,
    `${base}/assessments`,
    `${base}/reports`,
    ...reports.map((report) => `${base}/assessments/${report.slug}`),
    ...getAllPosts()
      .filter((post) => !post.noindex)
      .map((post) => post.canonical || `${base}/blog/${post.slug}`),
    `${base}/legal/terms`,
    `${base}/legal/privacy`,
    `${base}/legal/disclaimer`,
  ]

  return new Response(`${urls.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
