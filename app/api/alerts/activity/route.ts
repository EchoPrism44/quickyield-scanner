import { NextResponse } from 'next/server'
import { requireUserId } from '../../../../lib/auth'
import { getAlertActivity } from '../../../../lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ activity: await getAlertActivity(userId) })
}
