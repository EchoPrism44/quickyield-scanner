import { NextRequest, NextResponse } from 'next/server'
import { sendDigestEmail } from '../../../../lib/email'
import { getCachedOpportunities, getAllUsersForDigest } from '../../../../lib/store'
import type { Opportunity } from '../../../../lib/types'

export const dynamic = 'force-dynamic'

function weekLabel() {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function withGrade(pool: Opportunity) {
  return { ...pool, grade: pool.safety?.letter }
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '') ?? request.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [allUsers, allPools] = await Promise.all([
    getAllUsersForDigest(),
    getCachedOpportunities(),
  ])

  const safePools = allPools
    .filter((p) => p.risk === 'Low' && p.confidence >= 80)
    .sort((a, b) => b.apy - a.apy)

  const label = weekLabel()
  let sent = 0
  let skipped = 0
  const failures: string[] = []

  for (const user of allUsers) {
    const watchlistSet = new Set(user.watchlistIds)

    const watchlistPools = user.watchlistIds
      .map((id) => allPools.find((p) => p.id === id))
      .filter((p): p is Opportunity => Boolean(p))
      .map(withGrade)

    const topPicks = safePools
      .filter((p) => !watchlistSet.has(p.id))
      .slice(0, 3)
      .map(withGrade)

    const result = await sendDigestEmail(user.email, watchlistPools, topPicks, label)
    if (result.sent) {
      sent += 1
    } else {
      skipped += 1
      failures.push(`${user.email}: ${result.reason}`)
    }
  }

  return NextResponse.json({ label, recipients: allUsers.length, sent, skipped, failures })
}
