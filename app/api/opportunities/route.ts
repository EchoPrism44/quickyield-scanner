import { NextRequest, NextResponse } from 'next/server'
import { getOpportunities } from '../../../lib/opportunities'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const result = await getOpportunities({
    chain: searchParams.get('chain') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    risk: searchParams.get('risk') ?? undefined,
    time: searchParams.get('time') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    capital: Number(searchParams.get('capital') ?? 100),
  })

  return NextResponse.json(result)
}
