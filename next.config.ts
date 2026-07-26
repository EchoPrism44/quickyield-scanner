import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // NOTE: this package is intentionally NOT `"type": "module"`. With it,
  // Vercel's serverless launcher (___next_launcher.cjs) does require() on the
  // ESM page bundles and every dynamic route 500s with ERR_REQUIRE_ESM.
  // Keeping .js as CommonJS lets the launcher require() the pages normally.
  // (eslint.config.mjs stays ESM via its own extension.)
  // Pin the workspace root to this project so Turbopack doesn't crawl the
  // whole home directory when a stray lockfile exists in a parent folder.
  turbopack: { root: process.cwd() },

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
