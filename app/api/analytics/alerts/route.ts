import { NextResponse } from 'next/server'
import { getAlertAnalytics } from '../../../../lib/analytics'
import { requireUserId } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getAlertAnalytics(userId))
}
