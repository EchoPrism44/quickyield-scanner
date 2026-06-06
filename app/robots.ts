import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://quickyield.vercel.app')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/terminal', '/api/', '/sign-in', '/sign-up'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
