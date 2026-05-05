import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '../../../../lib/auth'
import { deleteAlertRule, updateAlertRule } from '../../../../lib/store'
import { alertRulePatchInput } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = alertRulePatchInput.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { id } = await context.params
  return NextResponse.json({ alerts: await updateAlertRule(userId, id, parsed.data) })
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  return NextResponse.json({ alerts: await deleteAlertRule(userId, id) })
}
