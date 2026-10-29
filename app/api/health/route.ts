import { NextResponse } from 'next/server'
import { hasDatabase, getDb } from '@/lib/db'
import { getCachedOpportunities } from '@/lib/store'

export const dynamic = 'force-dynamic'

type CheckStatus = 'unknown' | 'ok' | 'error'
type OverallStatus = 'ok' | 'error'

export async function GET() {
  const healthStatus: {
    status: OverallStatus
    timestamp: string
    checks: {
      database: { status: CheckStatus; message: string }
      cache: { status: CheckStatus; message: string }
    }
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'unknown', message: '' },
      cache: { status: 'unknown', message: '' }
    }
  }

  // Check database connectivity
  try {
    if (!hasDatabase()) {
      healthStatus.checks.database = {
        status: 'error',
        message: 'DATABASE_URL is not configured'
      }
      healthStatus.status = 'error'
    } else {
      getDb()
      healthStatus.checks.database = {
        status: 'ok',
        message: 'Database connection configured'
      }
    }
  } catch (error) {
    healthStatus.checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
    healthStatus.status = 'error'
  }

  // Check cache/opportunities functionality
  try {
    const opportunities = await getCachedOpportunities()
    healthStatus.checks.cache = {
      status: 'ok',
      message: `Cache accessible, ${opportunities.length} opportunities cached`
    }
  } catch (error) {
    healthStatus.checks.cache = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
    healthStatus.status = 'error'
  }

  const statusCode = healthStatus.status === 'ok' ? 200 : 503
  return NextResponse.json(healthStatus, { status: statusCode })
}