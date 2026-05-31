import type { AlertRule, Opportunity } from './types'

type TelegramSendResult =
  | { sent: true }
  | { sent: false; skipped?: true; reason: string }

function getTelegramToken() {
  return process.env.TELEGRAM_BOT_TOKEN
}

export function getTelegramDeepLink(token: string) {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
  if (!username) return null
  return `https://t.me/${username}?start=${token}`
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<TelegramSendResult> {
  const token = getTelegramToken()
  if (!token) return { sent: false, skipped: true, reason: 'TELEGRAM_BOT_TOKEN is not configured' }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) return { sent: false, reason: `Telegram returned ${response.status}` }
  return { sent: true }
}

export async function sendTelegramAlert(chatId: string, alert: AlertRule, opportunity: Opportunity): Promise<TelegramSendResult> {
  const token = getTelegramToken()
  if (!token) return { sent: false, skipped: true, reason: 'TELEGRAM_BOT_TOKEN is not configured' }

  const text = [
    `QuickYield alert: ${opportunity.name}`,
    `${opportunity.platform} on ${opportunity.chain}`,
    `APY: ${opportunity.apy.toFixed(2)}% | Safety score: ${opportunity.confidence}`,
    `Rule: ${alert.name}`,
    opportunity.actionUrl,
  ].join('\n')

  return sendTelegramMessage(chatId, text)
}
