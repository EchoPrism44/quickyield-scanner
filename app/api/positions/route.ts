import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '../../../lib/auth'
import { safetyGradeOf } from '../../../lib/grade'
import { scanAndCacheYields } from '../../../lib/opportunities'
import { addPosition, getPositions } from '../../../lib/store'
import { positionInput } from '../../../lib/validation'
import type { Opportunity, PositionView } from '../../../lib/types'

export const dynamic = 'force-dynamic'

function enrich(rows: Awaited<ReturnType<typeof getPositions>>, byId: Map<string, Opportunity>): PositionView[] {
  return rows.map((p) => {
    const opp = byId.get(p.opportunityId)
    return {
      ...p,
      current: opp ? { apy: opp.apy, tvl: opp.tvl, safety: safetyGradeOf(opp), logoUrl: opp.logoUrl } : null,
    }
  })
}

export async function GET() {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [rows, scan] = await Promise.all([getPositions(userId), scanAndCacheYields()])
  const byId = new Map(scan.opportunities.map((o) => [o.id, o]))
  return NextResponse.json({ positions: enrich(rows, byId) })
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = positionInput.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const scan = await scanAndCacheYields()
  const opp = scan.opportunities.find((o) => o.id === parsed.data.opportunityId)
  if (!opp) return NextResponse.json({ error: 'Pool not found in the current scan.' }, { status: 400 })

  const result = await addPosition(userId, {
    opportunityId: opp.id,
    platform: opp.platform,
    asset: opp.asset,
    chain: opp.chain,
    amountUsd: parsed.data.amountUsd,
    entryApy: opp.apy,
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  const byId = new Map(scan.opportunities.map((o) => [o.id, o]))
  return NextResponse.json({ positions: enrich(result.positions, byId) })
}
