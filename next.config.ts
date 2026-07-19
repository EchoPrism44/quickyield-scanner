import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const projectRoot = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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
