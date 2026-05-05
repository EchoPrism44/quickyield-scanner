import { auth } from '@clerk/nextjs/server'

export async function requireUserId() {
  if (!process.env.CLERK_SECRET_KEY) return 'local-beta-user'
  const { userId } = await auth()
  return userId
}
