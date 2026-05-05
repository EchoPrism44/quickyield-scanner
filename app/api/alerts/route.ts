import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '../../../lib/auth'
import { createAlertRule, getAlertRules } from '../../../lib/store'
import { alertRuleInput } from '../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ alerts: await getAlertRules(userId) })
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = alertRuleInput.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const result = await createAlertRule(userId, parsed.data)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ alerts: result.alerts })
}
