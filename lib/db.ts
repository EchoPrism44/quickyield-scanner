import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let client: ReturnType<typeof postgres> | null = null
let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  if (!client) client = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 10, idle_timeout: 20, max: 5 })
  if (!db) db = drizzle(client, { schema })
  return db
}
