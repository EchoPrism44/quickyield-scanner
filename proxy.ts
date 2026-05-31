import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl
  const localDemo = process.env.NODE_ENV !== 'production' && (
    process.env.QUICKYIELD_LOCAL_DEMO === '1' ||
    process.env.NEXT_PUBLIC_QUICKYIELD_LOCAL_DEMO === '1' ||
    !process.env.CLERK_SECRET_KEY
  )
  const publicApiRoutes = ['/api/opportunities', '/api/cron/scan-yields', '/api/telegram/webhook']
  const isPublicApi = publicApiRoutes.some((route) => pathname.startsWith(route))
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/analytics') || (pathname.startsWith('/api/') && !isPublicApi)

  if (isProtectedRoute && !localDemo) {
    await auth.protect()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
