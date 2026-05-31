import { NextResponse } from 'next/server'
import { getAnalyticsData } from '../../../../lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getAnalyticsData()
  return NextResponse.json({
    marketMap: data.marketMap,
    lastUpdated: data.lastUpdated,
  })
}
