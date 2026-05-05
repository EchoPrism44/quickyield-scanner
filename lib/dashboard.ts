import { requireUserId } from './auth'
import { getOpportunities } from './opportunities'
import { getAlertRules, getUserSettings, getWatchlist } from './store'
import type { DashboardData } from './types'

export async function getInitialDashboardData(): Promise<DashboardData> {
  const userId = await requireUserId()
  const settings = await getUserSettings(userId ?? 'local-beta-user')
  const [opportunityResult, watchlist, alerts] = await Promise.all([
    getOpportunities(settings),
    getWatchlist(userId ?? 'local-beta-user'),
    getAlertRules(userId ?? 'local-beta-user'),
  ])

  return {
    ...opportunityResult,
    watchlist,
    alerts,
    settings,
  }
}
