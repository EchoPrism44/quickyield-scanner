import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  if (!db) db = drizzle(neon(process.env.DATABASE_URL), { schema })
  return db
}
