import { NextResponse } from 'next/server'
import { requireUserId } from '../../../../lib/auth'
import { removeWatchlistItem } from '../../../../lib/store'

export const dynamic = 'force-dynamic'

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  return NextResponse.json({ items: await removeWatchlistItem(userId, id) })
}
