import { NextRequest, NextResponse } from 'next/server'
import { sendAlertEmail } from '../../../../lib/email'
import { scanAndCacheYields } from '../../../../lib/opportunities'
import { getAlertRules, recordAlertDelivery, wasAlertDelivered } from '../../../../lib/store'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '') ?? request.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scan = await scanAndCacheYields()
  const alerts = await getAlertRules()
  let deliveries = 0

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
    const deliveryKey = `${alert.id}:${match.id}:${Math.round(match.apy * 10)}`
    if (await wasAlertDelivered(deliveryKey)) continue
    await sendAlertEmail(alert, match)
    await recordAlertDelivery(alert.userId, alert.id, match.id, deliveryKey)
    deliveries += 1
  }

  return NextResponse.json({ cached: scan.opportunities.length, status: scan.dataStatus, deliveries })
}
