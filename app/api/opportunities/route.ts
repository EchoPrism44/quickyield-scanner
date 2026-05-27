import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '../../../lib/auth'
import { getOpportunities } from '../../../lib/opportunities'
import { getWatchlist } from '../../../lib/store'
import type { OpportunityPreset } from '../../../lib/types'

export const dynamic = 'force-dynamic'

const presets = new Set(['safe-stablecoins', 'eth-staking', 'solana-yield', 'high-apy', 'saved'])

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const presetParam = searchParams.get('preset') ?? undefined
  const preset = presetParam && presets.has(presetParam) ? presetParam as OpportunityPreset : undefined
  const userId = preset === 'saved' ? await requireUserId() : null
  const savedIds = userId ? await getWatchlist(userId) : undefined
  const result = await getOpportunities({
    chain: searchParams.get('chain') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    risk: searchParams.get('risk') ?? undefined,
    time: searchParams.get('time') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    capital: Number(searchParams.get('capital') ?? 100),
    preset,
    savedIds,
    page: Number(searchParams.get('page') ?? 1),
    pageSize: Number(searchParams.get('pageSize') ?? 50),
  })

  return NextResponse.json(result)
}
