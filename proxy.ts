import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Only run Clerk when a real publishable key is configured. clerkMiddleware()
// throws `throwMissingPublishableKeyError` on every request when the key is
// absent/invalid — which would 500 the ENTIRE dynamic site (landing, yields,
// terminal), not just auth. Guarding here keeps the public site up even if
// Clerk is misconfigured in the deployment env; auth-only routes still
// self-guard via requireUserId() -> 401.
const clerkEnabled =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'string' &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')

const withClerk = clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl
  const localDemo = process.env.NODE_ENV !== 'production' && (
    process.env.QUICKYIELD_LOCAL_DEMO === '1' ||
    process.env.NEXT_PUBLIC_QUICKYIELD_LOCAL_DEMO === '1' ||
    !process.env.CLERK_SECRET_KEY
  )
  // CMC model: the terminal is public read-only; only user-scoped APIs and
  // /analytics require auth. Every user-scoped route also does its own
  // requireUserId() -> 401 (defense in depth).
  const publicApiRoutes = ['/api/opportunities', '/api/cron/scan-yields', '/api/cron/weekly-digest', '/api/telegram/webhook', '/api/pools', '/api/ledger']
  const isPublicApi = publicApiRoutes.some((route) => pathname.startsWith(route))
  const isProtectedRoute = pathname.startsWith('/analytics') || (pathname.startsWith('/api/') && !isPublicApi)

  if (isProtectedRoute && !localDemo) {
    await auth.protect()
  }

  return NextResponse.next()
})

// Fallback when Clerk isn't configured: never touch Clerk. Public pages/APIs
// stay up; auth-only routes aren't protected at the edge here, but they still
// self-guard in their handlers (requireUserId returns null -> 401).
function withoutClerk() {
  return NextResponse.next()
}

export default clerkEnabled ? withClerk : withoutClerk

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
