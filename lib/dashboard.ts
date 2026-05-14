import { currentUser } from '@clerk/nextjs/server'
import { LOCAL_USER_ID, canUseLocalUser, requireDashboardUserId } from './auth'
import { getOpportunities } from './opportunities'
import { ensureUser, getAlertRules, getNotificationStatus, getUserSettings, getWatchlist } from './store'
import type { DashboardData, DashboardUser } from './types'

export async function getInitialDashboardData(): Promise<DashboardData> {
  const userId = await requireDashboardUserId('/dashboard')
  const clerkUser = canUseLocalUser() ? null : await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? ''
  const user: DashboardUser = canUseLocalUser()
    ? { id: LOCAL_USER_ID, name: 'Local beta user', email: 'local@example.com', isLocal: true }
    : {
        id: userId,
        name: (clerkUser?.fullName ?? clerkUser?.firstName ?? email.split('@')[0]) || 'QuickYield user',
        email,
        imageUrl: clerkUser?.imageUrl,
        isLocal: false,
      }

  await ensureUser(userId, user.email)
  const settings = await getUserSettings(userId)
  const [opportunityResult, watchlist, alerts, notifications] = await Promise.all([
    getOpportunities(settings),
    getWatchlist(userId),
    getAlertRules(userId),
    getNotificationStatus(userId),
  ])

  return {
    user,
    ...opportunityResult,
    watchlist,
    alerts,
    settings,
    notifications,
  }
}
