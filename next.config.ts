import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const projectRoot = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // NOTE: do not set `output: 'standalone'` here. Combined with this package's
  // `"type": "module"`, Vercel's serverless launcher (___next_launcher.cjs)
  // does require() on the ESM page bundles and every dynamic route 500s with
  // ERR_REQUIRE_ESM. Vercel does its own (ESM-aware) bundling, so standalone
  // is only needed for self-hosting (Docker/VPS) — which we don't do.
  // Pin the workspace root to this project so Turbopack doesn't crawl the
  // whole home directory when a stray lockfile exists in a parent folder.
  turbopack: { root: projectRoot },

  async redirects() {
    return [
      { source: '/dashboard', destination: '/terminal', permanent: true },
      { source: '/dashboard/:path*', destination: '/terminal/:path*', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
