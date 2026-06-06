import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '../../../../lib/auth'
import { removePosition } from '../../../../lib/store'

export const dynamic = 'force-dynamic'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const positions = await removePosition(userId, id)
  return NextResponse.json({ positions })
}
