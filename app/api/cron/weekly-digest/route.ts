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

/**
 * Weekly digest sender. Triggered by the Vercel cron in vercel.json
 * (Sundays 08:00 UTC, sends `Authorization: Bearer $CRON_SECRET`) and by
 * the weekly-digest GitHub Action fallback. Manual test:
 *   curl "https://<host>/api/cron/weekly-digest?secret=$CRON_SECRET"
 * NOTE: silently no-ops with 401 if CRON_SECRET is not set in the env.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '') ?? request.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    console.error('[weekly-digest] unauthorized invocation', {
      hasCronSecretEnv: Boolean(process.env.CRON_SECRET),
      hasAuthHeader: Boolean(request.headers.get('authorization')),
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [allUsers, allPools] = await Promise.all([
    getAllUsersForDigest(),
    getCachedOpportunities(),
  ])
  console.log('[weekly-digest] run started', { recipients: allUsers.length, cachedPools: allPools.length })

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

  console.log('[weekly-digest] run finished', { label, recipients: allUsers.length, sent, skipped, failures })
  return NextResponse.json({ label, recipients: allUsers.length, sent, skipped, failures })
}
