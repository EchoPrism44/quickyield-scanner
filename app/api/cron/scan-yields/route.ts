import { NextRequest, NextResponse } from 'next/server'
import { alertMatchesOpportunity } from '../../../../lib/alerts'
import { sendAlertEmail } from '../../../../lib/email'
import { scanAndCacheYields } from '../../../../lib/opportunities'
import { getAlertRules, getNotificationChannels, getOpportunitySnapshots, pruneOldSnapshots, recordAlertDelivery, wasAlertDelivered } from '../../../../lib/store'
import { sendTelegramAlert } from '../../../../lib/telegram'
import type { AlertRule, Opportunity } from '../../../../lib/types'

/**
 * Find the first opportunity matching an alert. For tvl-drop we need the pool's
 * TVL at the previous scan, so we look up its snapshot history (the current scan
 * was already persisted by scanAndCacheYields, so index -2 is the prior value).
 */
async function findMatch(alert: AlertRule, opportunities: Opportunity[]): Promise<Opportunity | undefined> {
  if (alert.condition !== 'tvl-drop') {
    return opportunities.find((item) => alertMatchesOpportunity(alert, item))
  }
  for (const item of opportunities) {
    const snaps = await getOpportunitySnapshots(item.id, 2)
    const previousTvlUsd = snaps.length >= 2 ? snaps[snaps.length - 2].tvlUsd : undefined
    if (alertMatchesOpportunity(alert, item, { previousTvlUsd })) return item
  }
  return undefined
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '') ?? request.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const failures: string[] = []
  const scan = await scanAndCacheYields()
  let alerts: AlertRule[] = []
  try {
    alerts = await getAlertRules()
  } catch (error) {
    failures.push(`Alert lookup failed: ${error instanceof Error ? error.message : 'Database unavailable'}`)
  }
  let matched = 0
  let emailSent = 0
  let telegramSent = 0
  let duplicatesSkipped = 0

  for (const alert of alerts.filter((item) => item.enabled)) {
    const match = await findMatch(alert, scan.opportunities)

    if (!match) continue
    matched += 1
    const deliveryKey = `${alert.id}:${match.id}:${alert.condition}:${Math.round(match.apy * 10)}`
    if (await wasAlertDelivered(deliveryKey)) {
      duplicatesSkipped += 1
      continue
    }

    const channels = await getNotificationChannels(alert.userId)
    const telegram = channels.find((channel) => channel.type === 'telegram' && channel.enabled && channel.verified)
    const email = channels.find((channel) => channel.type === 'email' && channel.enabled && channel.verified)
    let delivered = false
    if (!telegram && !email) failures.push(`No enabled notification channels for ${alert.userId}`)

    if (telegram) {
      const result = await sendTelegramAlert(telegram.destination, alert, match)
      if ('sent' in result && result.sent) {
        telegramSent += 1
        delivered = true
      }
      else failures.push(result.reason)
    }
    if (email) {
      const result = await sendAlertEmail(email.destination, alert, match)
      if (result.sent) {
        emailSent += 1
        delivered = true
      }
      else failures.push(result.reason)
    }

    if (delivered) {
      await recordAlertDelivery(alert.userId, alert.id, match.id, deliveryKey, {
        alertId: alert.id,
        alertName: alert.name,
        opportunityId: match.id,
        poolName: match.name,
        platform: match.platform,
        asset: match.asset,
        chain: match.chain,
        apy: match.apy,
        channel: [telegram && 'Telegram', email && 'Email'].filter(Boolean).join(' + ') || 'Notification',
      })
    }
  }

  // Keep the snapshots table bounded (it grows by ~pool-count rows per scan).
  try {
    await pruneOldSnapshots()
  } catch (error) {
    failures.push(`Snapshot prune failed: ${error instanceof Error ? error.message : 'unknown'}`)
  }

  return NextResponse.json({
    scanned: scan.opportunities.length,
    status: scan.dataStatus,
    // Surfaced so the cron job can fail on it. A failed cache write still
    // returns dataStatus 'live' (the pools were fetched, they just weren't
    // persisted), so without this the most damaging outcome — the scan
    // "succeeding" while the cache everyone reads goes stale — looks
    // identical to a healthy run.
    fallbackReason: scan.fallbackReason ?? null,
    matched,
    emailSent,
    telegramSent,
    duplicatesSkipped,
    failures,
  })
}
