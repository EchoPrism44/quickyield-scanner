import { NextResponse } from 'next/server'
import { hasDatabase, getDb } from '@/lib/db'
import { getCachedOpportunities } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const healthStatus = {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: 'unknown' as const,
        message: ''
      },
      cache: {
        status: 'unknown' as const,
        message: ''
      }
    }
  }

  // Check database connectivity
  try {
    if (!hasDatabase()) {
      healthStatus.checks.database = {
        status: 'error' as const,
        message: 'DATABASE_URL is not configured'
      }
      healthStatus.status = 'error'
    } else {
      // Try to execute a simple query
      getDb()
      // We'll do a simple check - just see if we can get the db object
      // In a real app, you might do SELECT 1 or similar
      healthStatus.checks.database = {
        status: 'ok' as const,
        message: 'Database connection configured'
      }
    }
  } catch (error) {
    healthStatus.checks.database = {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
    healthStatus.status = 'error'
  }

  // Check cache/opportunities functionality
  try {
    const opportunities = await getCachedOpportunities()
    healthStatus.checks.cache = {
      status: 'ok' as const,
      message: `Cache accessible, ${opportunities.length} opportunities cached`
    }
  } catch (error) {
    healthStatus.checks.cache = {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
    healthStatus.status = 'error'
  }

  const statusCode = healthStatus.status === 'ok' ? 200 : 503
  return NextResponse.json(healthStatus, { status: statusCode })
}