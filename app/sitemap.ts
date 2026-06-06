import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://quickyield.vercel.app')

const assets = ['usdc', 'usdt', 'dai', 'eth', 'steth', 'sol']

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/yields`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    ...assets.map((a) => ({ url: `${base}/yields/${a}`, lastModified: now, changeFrequency: 'hourly' as const, priority: 0.7 })),
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
