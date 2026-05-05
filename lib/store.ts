import { desc, eq, sql } from 'drizzle-orm'
import { ALERT_LIMIT, WATCHLIST_LIMIT, defaultSettings } from './constants'
import { getDb, hasDatabase } from './db'
import { memory } from './memory-store'
import { alertDeliveries, alertRules, opportunitiesCache, users, watchlistItems } from './schema'
import type { AlertRule, Opportunity, UserSettings } from './types'

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function parseSettings(value?: string | null): UserSettings {
  if (!value) return defaultSettings
  return { ...defaultSettings, ...JSON.parse(value) }
}

function dbAlertToAlert(row: typeof alertRules.$inferSelect): AlertRule {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    chain: row.chain,
    category: row.category,
    asset: row.asset,
    minApy: Number(row.minApy),
    maxRisk: row.maxRisk === 'Medium' ? 'Medium' : 'Low',
    minConfidence: row.minConfidence,
    frequency: row.frequency === 'instant' || row.frequency === 'weekly' ? row.frequency : 'daily',
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function ensureUser(userId: string) {
  if (!hasDatabase()) return
  const db = getDb()
  const existing = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)
  if (existing.length) return
  await db.insert(users).values({
    id: id('user'),
    clerkUserId: userId,
    settingsJson: JSON.stringify(defaultSettings),
  })
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  if (!hasDatabase()) return memory.settings.get(userId) ?? defaultSettings
  await ensureUser(userId)
  const db = getDb()
  const [row] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)
  return parseSettings(row?.settingsJson)
}

export async function updateUserSettings(userId: string, patch: Partial<UserSettings>) {
  const next = { ...(await getUserSettings(userId)), ...patch }
  if (!hasDatabase()) {
    memory.settings.set(userId, next)
    return next
  }
  await ensureUser(userId)
  await getDb().update(users).set({ settingsJson: JSON.stringify(next), updatedAt: new Date() }).where(eq(users.clerkUserId, userId))
  return next
}

export async function getWatchlist(userId: string) {
  if (!hasDatabase()) return memory.watchlists.get(userId) ?? []
  const rows = await getDb().select().from(watchlistItems).where(eq(watchlistItems.userId, userId)).orderBy(desc(watchlistItems.createdAt))
  return rows.map((row) => row.opportunityId)
}

export async function addWatchlistItem(userId: string, opportunityId: string) {
  const current = await getWatchlist(userId)
  if (current.includes(opportunityId)) return { ok: true as const, items: current }
  if (current.length >= WATCHLIST_LIMIT) return { ok: false as const, error: `Beta watchlist limit is ${WATCHLIST_LIMIT} items.` }
  const next = [...current, opportunityId]
  if (!hasDatabase()) {
    memory.watchlists.set(userId, next)
    return { ok: true as const, items: next }
  }
  await getDb().insert(watchlistItems).values({ id: id('watch'), userId, opportunityId }).onConflictDoNothing()
  return { ok: true as const, items: await getWatchlist(userId) }
}

export async function removeWatchlistItem(userId: string, opportunityId: string) {
  if (!hasDatabase()) {
    const next = (memory.watchlists.get(userId) ?? []).filter((item) => item !== opportunityId)
    memory.watchlists.set(userId, next)
    return next
  }
  await getDb().delete(watchlistItems).where(sql`${watchlistItems.userId} = ${userId} and ${watchlistItems.opportunityId} = ${opportunityId}`)
  return getWatchlist(userId)
}

export async function getAlertRules(userId?: string) {
  if (!hasDatabase()) {
    const all = [...memory.alerts.values()].flat()
    return userId ? all.filter((alert) => alert.userId === userId) : all
  }
  const rows = userId
    ? await getDb().select().from(alertRules).where(eq(alertRules.userId, userId)).orderBy(desc(alertRules.createdAt))
    : await getDb().select().from(alertRules).orderBy(desc(alertRules.createdAt))
  return rows.map(dbAlertToAlert)
}

export async function createAlertRule(userId: string, input: Omit<AlertRule, 'id' | 'userId' | 'createdAt'>) {
  const current = await getAlertRules(userId)
  if (current.filter((alert) => alert.enabled).length >= ALERT_LIMIT) {
    return { ok: false as const, error: `Beta alert limit is ${ALERT_LIMIT} active rules.` }
  }
  const alert: AlertRule = { ...input, id: id('alert'), userId, createdAt: new Date().toISOString() }
  if (!hasDatabase()) {
    memory.alerts.set(userId, [alert, ...current])
    return { ok: true as const, alerts: await getAlertRules(userId) }
  }
  await getDb().insert(alertRules).values({
    id: alert.id,
    userId,
    name: alert.name,
    chain: alert.chain,
    category: alert.category,
    asset: alert.asset,
    minApy: String(alert.minApy),
    maxRisk: alert.maxRisk,
    minConfidence: alert.minConfidence,
    frequency: alert.frequency,
    enabled: alert.enabled,
  })
  return { ok: true as const, alerts: await getAlertRules(userId) }
}

export async function updateAlertRule(userId: string, alertId: string, patch: Partial<AlertRule>) {
  if (!hasDatabase()) {
    const next = (memory.alerts.get(userId) ?? []).map((alert) => (alert.id === alertId ? { ...alert, ...patch } : alert))
    memory.alerts.set(userId, next)
    return next
  }
  await getDb().update(alertRules).set({
    name: patch.name,
    chain: patch.chain,
    category: patch.category,
    asset: patch.asset,
    minApy: patch.minApy === undefined ? undefined : String(patch.minApy),
    maxRisk: patch.maxRisk,
    minConfidence: patch.minConfidence,
    frequency: patch.frequency,
    enabled: patch.enabled,
  }).where(sql`${alertRules.id} = ${alertId} and ${alertRules.userId} = ${userId}`)
  return getAlertRules(userId)
}

export async function deleteAlertRule(userId: string, alertId: string) {
  if (!hasDatabase()) {
    const next = (memory.alerts.get(userId) ?? []).filter((alert) => alert.id !== alertId)
    memory.alerts.set(userId, next)
    return next
  }
  await getDb().delete(alertRules).where(sql`${alertRules.id} = ${alertId} and ${alertRules.userId} = ${userId}`)
  return getAlertRules(userId)
}

export async function cacheOpportunities(opportunities: Opportunity[]) {
  if (!hasDatabase()) {
    memory.opportunities = opportunities
    return
  }
  const db = getDb()
  for (const item of opportunities) {
    await db.insert(opportunitiesCache).values({
      id: item.id,
      payloadJson: JSON.stringify(item),
      source: item.source,
      chain: item.chain,
      category: item.category,
      asset: item.asset,
      apy: String(item.apy),
      tvlUsd: String(item.tvlUsd),
      riskLevel: item.risk,
      confidence: item.confidence,
      lastSeenAt: new Date(item.lastSeenAt),
    }).onConflictDoUpdate({
      target: opportunitiesCache.id,
      set: {
        payloadJson: JSON.stringify(item),
        apy: String(item.apy),
        tvlUsd: String(item.tvlUsd),
        riskLevel: item.risk,
        confidence: item.confidence,
        lastSeenAt: new Date(item.lastSeenAt),
      },
    })
  }
}

export async function getCachedOpportunities() {
  if (!hasDatabase()) return memory.opportunities
  const rows = await getDb().select().from(opportunitiesCache).orderBy(desc(opportunitiesCache.lastSeenAt)).limit(50)
  return rows.map((row) => JSON.parse(row.payloadJson) as Opportunity)
}

export async function wasAlertDelivered(deliveryKey: string) {
  if (!hasDatabase()) return memory.deliveries.has(deliveryKey)
  const rows = await getDb().select().from(alertDeliveries).where(eq(alertDeliveries.deliveryKey, deliveryKey)).limit(1)
  return rows.length > 0
}

export async function recordAlertDelivery(userId: string, alertId: string, opportunityId: string, deliveryKey: string) {
  if (!hasDatabase()) {
    memory.deliveries.add(deliveryKey)
    return
  }
  await getDb().insert(alertDeliveries).values({ id: id('delivery'), userId, alertId, opportunityId, deliveryKey }).onConflictDoNothing()
}
