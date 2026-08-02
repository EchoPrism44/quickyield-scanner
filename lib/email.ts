import { Resend } from 'resend'
import { AlertEmail } from '../emails/alert-email'
import { DigestEmail } from '../emails/digest-email'
import type { AlertRule, Opportunity } from './types'

let resend: Resend | null = null

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

export async function sendAlertEmail(to: string | undefined, alert: AlertRule, opportunity: Opportunity) {
  const client = getResend()
  if (!client) return { sent: false as const, skipped: true as const, reason: 'RESEND_API_KEY is not configured' }
  if (!to) return { sent: false as const, skipped: true as const, reason: 'No verified email destination configured' }

  const result = await client.emails.send({
    from: process.env.RESEND_FROM ?? 'Litmus <onboarding@resend.dev>',
    to,
    subject: `Litmus alert: ${opportunity.name}`,
    react: AlertEmail({ alert, opportunity }),
  })
  if (result.error) return { sent: false as const, reason: result.error.message }
  return { sent: true as const }
}

export async function sendDigestEmail(
  to: string,
  watchlistPools: (Opportunity & { grade?: string })[],
  topPicks: (Opportunity & { grade?: string })[],
  weekLabel: string,
) {
  const client = getResend()
  if (!client) return { sent: false as const, reason: 'RESEND_API_KEY is not configured' }

  const result = await client.emails.send({
    from: process.env.RESEND_FROM ?? 'Litmus <onboarding@resend.dev>',
    to,
    subject: `Litmus: your weekly Safe Yield digest — ${weekLabel}`,
    react: DigestEmail({ watchlistPools, topPicks, weekLabel }),
  })
  if (result.error) return { sent: false as const, reason: result.error.message }
  return { sent: true as const }
}
