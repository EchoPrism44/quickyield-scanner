import { NextRequest, NextResponse } from 'next/server'
import { getPoolHistoryData } from '../../../../../lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 168)
  const history = await getPoolHistoryData(id, Math.min(720, Math.max(1, Math.floor(limit) || 168)))
  return NextResponse.json({ history })
}
