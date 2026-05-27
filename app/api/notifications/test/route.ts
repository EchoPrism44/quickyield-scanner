import { NextResponse } from 'next/server'
import { requireUserId } from '../../../../lib/auth'
import { sendAlertEmail } from '../../../../lib/email'
import { getOpportunities } from '../../../../lib/opportunities'
import { getAlertRules, getNotificationChannels } from '../../../../lib/store'
import { sendTelegramAlert } from '../../../../lib/telegram'
import type { AlertRule } from '../../../../lib/types'

export const dynamic = 'force-dynamic'

export async function POST() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [channels, alerts, scan] = await Promise.all([
    getNotificationChannels(userId),
    getAlertRules(userId),
    getOpportunities({ pageSize: 1, capital: 100000 }),
  ])
  const opportunity = scan.opportunities[0]
  if (!opportunity) return NextResponse.json({ error: 'No opportunity is available for a test alert.' }, { status: 400 })

  const alert: AlertRule = alerts[0] ?? {
    id: 'test-alert',
    userId,
    name: `${opportunity.asset} test target`,
    chain: opportunity.chain,
    category: opportunity.category,
    asset: opportunity.asset,
    minApy: Math.max(1, Math.floor(opportunity.apy)),
    maxRisk: opportunity.risk,
    minConfidence: Math.max(70, opportunity.confidence - 5),
    frequency: 'instant',
    enabled: true,
    createdAt: new Date().toISOString(),
  }

  const results: string[] = []
  const telegram = channels.find((channel) => channel.type === 'telegram' && channel.enabled && channel.verified)
  const email = channels.find((channel) => channel.type === 'email' && channel.enabled && channel.verified)

  if (telegram) {
    const result = await sendTelegramAlert(telegram.destination, alert, opportunity)
    results.push(result.sent ? 'Telegram test sent' : result.reason)
  }
  if (email) {
    const result = await sendAlertEmail(email.destination, alert, opportunity)
    results.push(result.sent ? 'Email test sent' : result.reason)
  }

  if (!results.length) return NextResponse.json({ error: 'No enabled verified notification channel is connected.' }, { status: 400 })
  return NextResponse.json({ ok: true, results })
}
