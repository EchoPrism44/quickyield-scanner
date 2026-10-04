import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAssessmentLead } from '../../../lib/store'
import { sendAssessmentLeadEmails } from '../../../lib/email'

const requestSchema = z.object({
  protocol: z.string().trim().min(2).max(120),
  pool: z.string().trim().min(2).max(160),
  chain: z.string().trim().min(2).max(80),
  poolId: z.string().trim().max(160).optional(),
  llamaUrl: z.string().trim().url().max(300).optional().or(z.literal('')),
  tvlUsd: z.coerce.number().finite().nonnegative().optional(),
  requesterName: z.string().trim().min(2).max(120),
  workEmail: z.string().trim().email().max(200),
  role: z.string().trim().max(120).optional(),
  tier: z.enum(['one_pool', 'three_pools']),
  timing: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  website: z.string().max(0).optional(),
})

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Please complete the required fields.' }, { status: 400 })
  const { website, ...input } = parsed.data
  void website
  const lead = await createAssessmentLead(input)
  const email = await sendAssessmentLeadEmails(lead)
  return NextResponse.json({ ok: true, leadId: lead.id, email: email.sent ? 'sent' : email.reason }, { status: 201 })
}
