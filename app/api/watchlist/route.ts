import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '../../../lib/auth'
import { addWatchlistItem, getWatchlist } from '../../../lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ items: await getWatchlist(userId) })
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as { opportunityId?: string }
  if (!body.opportunityId) return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 })
  const result = await addWatchlistItem(userId, body.opportunityId)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ items: result.items })
}
