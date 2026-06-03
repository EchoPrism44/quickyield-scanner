import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// Load DATABASE_URL from a gitignored env file so secrets never live in the
// shell or in source. `vercel env pull .env.local` is the easiest way to get it.
if (existsSync('.env.local')) process.loadEnvFile('.env.local')
else if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
