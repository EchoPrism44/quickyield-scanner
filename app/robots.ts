import type { MetadataRoute } from 'next'

// Keep robots.txt and the sitemap on Litmus's single canonical public origin.
const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.getlitmus.xyz'

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
