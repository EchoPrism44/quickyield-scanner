import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const LOCAL_USER_ID = 'local-beta-user'

export function canUseLocalUser() {
  return process.env.NODE_ENV !== 'production' && !process.env.CLERK_SECRET_KEY
}

export async function requireUserId() {
  if (canUseLocalUser()) return LOCAL_USER_ID
  const { userId } = await auth()
  return userId
}

export async function requireDashboardUserId(returnBackUrl = '/dashboard'): Promise<string> {
  if (canUseLocalUser()) return LOCAL_USER_ID
  const session = await auth()
  if (!session.userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(returnBackUrl)}`)
  }
  return session.userId as string
}
