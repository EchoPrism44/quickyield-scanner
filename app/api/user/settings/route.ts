import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '../../../../lib/auth'
import { getNotificationStatus, getUserSettings, updateNotificationChannel, updateUserSettings } from '../../../../lib/store'
import { settingsInput } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [settings, notifications] = await Promise.all([getUserSettings(userId), getNotificationStatus(userId)])
  return NextResponse.json({ settings, notifications })
}

export async function PATCH(request: NextRequest) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = settingsInput.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { notificationChannels, ...settingsPatch } = parsed.data
  const settings = Object.keys(settingsPatch).length ? await updateUserSettings(userId, settingsPatch) : await getUserSettings(userId)
  if (notificationChannels?.email !== undefined) await updateNotificationChannel(userId, 'email', notificationChannels.email)
  if (notificationChannels?.telegram !== undefined) await updateNotificationChannel(userId, 'telegram', notificationChannels.telegram)
  const notifications = await getNotificationStatus(userId)
  return NextResponse.json({ settings, notifications })
}
