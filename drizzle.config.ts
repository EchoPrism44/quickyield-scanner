import { existsSync, readFileSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// Load env from a gitignored file so secrets never live in the shell or source.
// `vercel env pull .env.local` is the easiest way to get it. Lenient parser:
// skips lines it can't parse (Vercel exports can include values the strict
// native process.loadEnvFile() rejects).
function loadEnvFile(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    // Skip empty values so a blank duplicate line can't clobber a real one
    // (Vercel pulls sensitive vars like DATABASE_URL down empty).
    if (value !== '') process.env[match[1]] = value
  }
}
loadEnvFile('.env.local')
loadEnvFile('.env')

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
