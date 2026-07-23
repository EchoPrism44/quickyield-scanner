import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const LOCAL_USER_ID = 'local-beta-user'

export function canUseLocalUser() {
  return process.env.NODE_ENV !== 'production' && (
    process.env.QUICKYIELD_LOCAL_DEMO === '1' ||
    process.env.NEXT_PUBLIC_QUICKYIELD_LOCAL_DEMO === '1' ||
    !process.env.CLERK_SECRET_KEY
  )
}

export async function requireUserId() {
  if (canUseLocalUser()) return LOCAL_USER_ID
  try {
    const { userId } = await auth()
    return userId
  } catch {
    // Clerk not configured / middleware bypassed: treat as unauthenticated so
    // protected routes return 401 instead of crashing with a 500.
    return null
  }
}

/**
 * Signed-in user id, or null for anonymous visitors (public CMC-style pages).
 * Never throws — a Clerk misconfiguration degrades to anonymous instead of a 500.
 */
export async function optionalUserId(): Promise<string | null> {
  if (canUseLocalUser()) return LOCAL_USER_ID
  try {
    const { userId } = await auth()
    return userId
  } catch {
    return null
  }
}

export async function requireDashboardUserId(returnBackUrl = '/terminal'): Promise<string> {
  if (canUseLocalUser()) return LOCAL_USER_ID
  const session = await auth()
  if (!session.userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(returnBackUrl)}`)
  }
  return session.userId as string
}
