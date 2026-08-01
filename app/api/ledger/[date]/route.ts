import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

/**
 * Serve a weekly grade snapshot as raw JSON from the app itself, so the
 * public ledger is inspectable without exposing the source repository.
 * GET /api/ledger/2026-06-22
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid snapshot date' }, { status: 400 })
  }
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'grades', `${date}.json`), 'utf8')
    return new NextResponse(raw, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `inline; filename="litmus-grades-${date}.json"`,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
  }
}
