import { NextResponse } from 'next/server'
import { requireUserId } from '../../../../../lib/auth'
import { createTelegramConnectToken } from '../../../../../lib/store'
import { getTelegramDeepLink } from '../../../../../lib/telegram'

export const dynamic = 'force-dynamic'

export async function POST() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token, expiresAt } = await createTelegramConnectToken(userId)
  const deepLink = getTelegramDeepLink(token)
  if (!deepLink) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not configured' }, { status: 500 })
  }

  return NextResponse.json({ deepLink, expiresAt })
}
