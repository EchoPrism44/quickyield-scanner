import { NextRequest, NextResponse } from 'next/server'
import { verifyTelegramConnectToken } from '../../../../lib/store'

export const dynamic = 'force-dynamic'

type TelegramUpdate = {
  message?: {
    text?: string
    chat?: { id?: number | string }
    from?: { username?: string; first_name?: string }
  }
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const update = (await request.json()) as TelegramUpdate
  const text = update.message?.text ?? ''
  const chatId = update.message?.chat?.id?.toString()
  const token = text.match(/^\/start\s+([a-f0-9]{32})/i)?.[1]

  if (!chatId || !token) return NextResponse.json({ ok: true, ignored: true })

  const username = update.message?.from?.username ? `@${update.message.from.username}` : update.message?.from?.first_name
  const channel = await verifyTelegramConnectToken(token, chatId, username)
  return NextResponse.json({ ok: Boolean(channel), connected: Boolean(channel) })
}
