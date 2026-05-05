import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '../../../../lib/auth'
import { getUserSettings, updateUserSettings } from '../../../../lib/store'
import { settingsInput } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ settings: await getUserSettings(userId) })
}

export async function PATCH(request: NextRequest) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = settingsInput.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  return NextResponse.json({ settings: await updateUserSettings(userId, parsed.data) })
}
