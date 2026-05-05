import { Resend } from 'resend'
import { AlertEmail } from '../emails/alert-email'
import type { AlertRule, Opportunity } from './types'

let resend: Resend | null = null

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

export async function sendAlertEmail(alert: AlertRule, opportunity: Opportunity) {
  const client = getResend()
  if (!client) return { skipped: true, reason: 'RESEND_API_KEY is not configured' }

  return client.emails.send({
    from: process.env.RESEND_FROM ?? 'QuickYield <onboarding@resend.dev>',
    to: process.env.ALERT_TEST_RECIPIENT ?? 'delivered@resend.dev',
    subject: `QuickYield alert: ${opportunity.name}`,
    react: AlertEmail({ alert, opportunity }),
  })
}
