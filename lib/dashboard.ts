import { currentUser } from '@clerk/nextjs/server'
import { LOCAL_USER_ID, canUseLocalUser, optionalUserId } from './auth'
import { defaultSettings } from './constants'
import { getOpportunities } from './opportunities'
import { getWeekOverWeekDelta } from './snapshot-delta'
import { ensureUser, getAlertRules, getNotificationStatus, getUserSettings, getWatchlist } from './store'
import type { DashboardData, DashboardUser, NotificationStatus } from './types'

const ANONYMOUS_USER: DashboardUser = {
  id: '',
  name: 'Guest',
  email: '',
  isLocal: false,
  isAnonymous: true,
}

const EMPTY_NOTIFICATIONS: NotificationStatus = {
  email: { enabled: false, verified: false },
  telegram: { enabled: false, connected: false },
}

/**
 * Terminal data for both signed-in and anonymous visitors (CMC model:
 * anyone can browse the market data; watchlist/alerts/settings are
 * per-user and stay empty until sign-in).
 */
export async function getInitialDashboardData(): Promise<DashboardData> {
  const userId = await optionalUserId()

  if (!userId) {
    const [opportunityResult, weekDelta] = await Promise.all([
      getOpportunities(defaultSettings),
      getWeekOverWeekDelta(),
    ])
    return {
      user: ANONYMOUS_USER,
      ...opportunityResult,
      watchlist: [],
      alerts: [],
      settings: defaultSettings,
      notifications: EMPTY_NOTIFICATIONS,
      weekDelta,
    }
  }

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
  const [opportunityResult, watchlist, alerts, notifications, weekDelta] = await Promise.all([
    getOpportunities(settings),
    getWatchlist(userId),
    getAlertRules(userId),
    getNotificationStatus(userId),
    getWeekOverWeekDelta(),
  ])

  return {
    user,
    ...opportunityResult,
    watchlist,
    alerts,
    settings,
    notifications,
    weekDelta,
  }
}
