import { NextRequest, NextResponse } from 'next/server'
import { sendAlertEmail } from '../../../../lib/email'
import { scanAndCacheYields } from '../../../../lib/opportunities'
import { getAlertRules, getNotificationChannels, recordAlertDelivery, wasAlertDelivered } from '../../../../lib/store'
import { sendTelegramAlert } from '../../../../lib/telegram'
import type { AlertRule } from '../../../../lib/types'

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
    const match = scan.opportunities.find((item) => {
      const riskOk = alert.maxRisk === 'Medium' || item.risk === 'Low'
      return (
        (!alert.chain || alert.chain === 'All chains' || item.chain === alert.chain) &&
        (!alert.category || alert.category === 'All categories' || item.category === alert.category) &&
        (!alert.asset || item.asset.toLowerCase().includes(alert.asset.toLowerCase())) &&
        item.apy >= alert.minApy &&
        item.confidence >= alert.minConfidence &&
        riskOk
      )
    })

    if (!match) continue
    matched += 1
    const deliveryKey = `${alert.id}:${match.id}:${Math.round(match.apy * 10)}`
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

  return NextResponse.json({
    scanned: scan.opportunities.length,
    status: scan.dataStatus,
    matched,
    emailSent,
    telegramSent,
    duplicatesSkipped,
    failures,
  })
}
