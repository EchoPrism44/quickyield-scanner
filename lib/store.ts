import { desc, eq, sql } from 'drizzle-orm'
import { ALERT_LIMIT, POSITION_LIMIT, WATCHLIST_LIMIT, defaultSettings } from './constants'
import { getDb, hasDatabase } from './db'
import { memory } from './memory-store'
import { alertDeliveries, alertRules, notificationChannels, opportunitiesCache, opportunitySnapshots, positions, telegramConnectTokens, users, watchlistItems } from './schema'
import type { AlertActivity, AlertRule, NotificationChannel, NotificationChannelType, NotificationStatus, Opportunity, OpportunitySnapshot, PoolDetail, Position, UserSettings } from './types'

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
    condition: (['apy-below', 'apy-drop', 'tvl-drop', 'reward-spike'] as const).includes(row.condition as never)
      ? (row.condition as AlertRule['condition'])
      : 'apy-above',
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
  }
}

function dbChannelToChannel(row: typeof notificationChannels.$inferSelect): NotificationChannel {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type === 'telegram' ? 'telegram' : 'email',
    destination: row.destination,
    label: row.label ?? undefined,
    enabled: row.enabled,
    verified: Boolean(row.verifiedAt),
    createdAt: row.createdAt.toISOString(),
  }
}

function notificationStatus(channels: NotificationChannel[]): NotificationStatus {
  const email = channels.find((channel) => channel.type === 'email')
  const telegram = channels.find((channel) => channel.type === 'telegram')
  return {
    email: {
      enabled: email?.enabled ?? false,
      destination: email?.destination,
      verified: email?.verified ?? false,
    },
    telegram: {
      enabled: telegram?.enabled ?? false,
      connected: Boolean(telegram?.verified),
      username: telegram?.label,
    },
  }
}

export async function ensureUser(userId: string, email?: string | null) {
  if (!hasDatabase()) return
  const db = getDb()
  const existing = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1)
  if (existing.length) {
    if (email && existing[0].email !== email) {
      await db.update(users).set({ email, updatedAt: new Date() }).where(eq(users.clerkUserId, userId))
    }
    return
  }
  await db.insert(users).values({
    id: id('user'),
    clerkUserId: userId,
    email: email ?? null,
    settingsJson: JSON.stringify(defaultSettings),
  })
  if (email) await upsertNotificationChannel(userId, 'email', email, 'Primary email', true)
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

export async function getUserEmail(userId: string) {
  if (!hasDatabase()) return undefined
  const [row] = await getDb().select().from(users).where(eq(users.clerkUserId, userId)).limit(1)
  return row?.email ?? undefined
}

export async function getNotificationChannels(userId: string) {
  if (!hasDatabase()) return memory.notificationChannels.get(userId) ?? []
  await ensureUser(userId)
  const rows = await getDb().select().from(notificationChannels).where(eq(notificationChannels.userId, userId)).orderBy(desc(notificationChannels.createdAt))
  return rows.map(dbChannelToChannel)
}

export async function getNotificationStatus(userId: string) {
  return notificationStatus(await getNotificationChannels(userId))
}

export async function upsertNotificationChannel(
  userId: string,
  type: NotificationChannelType,
  destination: string,
  label?: string,
  verified = false,
) {
  const now = new Date()
  if (!hasDatabase()) {
    const channels = memory.notificationChannels.get(userId) ?? []
    const existing = channels.find((channel) => channel.type === type && channel.destination === destination)
    const next: NotificationChannel = existing
      ? { ...existing, label, enabled: true, verified: existing.verified || verified }
      : {
          id: id('channel'),
          userId,
          type,
          destination,
          label,
          enabled: true,
          verified,
          createdAt: now.toISOString(),
        }
    memory.notificationChannels.set(userId, existing ? channels.map((channel) => (channel.id === existing.id ? next : channel)) : [next, ...channels])
    return next
  }

  await ensureUser(userId)
  await getDb().insert(notificationChannels).values({
    id: id('channel'),
    userId,
    type,
    destination,
    label,
    enabled: true,
    verifiedAt: verified ? now : null,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: [notificationChannels.userId, notificationChannels.type, notificationChannels.destination],
    set: {
      label,
      enabled: true,
      verifiedAt: verified ? now : sql`${notificationChannels.verifiedAt}`,
      updatedAt: now,
    },
  })
  const [channel] = (await getNotificationChannels(userId)).filter((item) => item.type === type && item.destination === destination)
  return channel
}

export async function updateNotificationChannel(userId: string, type: NotificationChannelType, enabled: boolean) {
  if (!hasDatabase()) {
    const channels = memory.notificationChannels.get(userId) ?? []
    memory.notificationChannels.set(userId, channels.map((channel) => (channel.type === type ? { ...channel, enabled } : channel)))
    return getNotificationStatus(userId)
  }
  await getDb().update(notificationChannels).set({ enabled, updatedAt: new Date() }).where(sql`${notificationChannels.userId} = ${userId} and ${notificationChannels.type} = ${type}`)
  return getNotificationStatus(userId)
}

export async function createTelegramConnectToken(userId: string) {
  const token = crypto.randomUUID().replaceAll('-', '')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
  if (!hasDatabase()) {
    memory.telegramConnectTokens.set(token, { userId, expiresAt, used: false })
    return { token, expiresAt: expiresAt.toISOString() }
  }
  await ensureUser(userId)
  await getDb().insert(telegramConnectTokens).values({ token, userId, expiresAt })
  return { token, expiresAt: expiresAt.toISOString() }
}

export async function verifyTelegramConnectToken(token: string, chatId: string, username?: string) {
  if (!hasDatabase()) {
    const record = memory.telegramConnectTokens.get(token)
    if (!record || record.used || record.expiresAt.getTime() < Date.now()) return null
    record.used = true
    const channel = await upsertNotificationChannel(record.userId, 'telegram', chatId, username, true)
    return channel
  }

  const [record] = await getDb().select().from(telegramConnectTokens).where(eq(telegramConnectTokens.token, token)).limit(1)
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) return null
  await getDb().update(telegramConnectTokens).set({ usedAt: new Date() }).where(eq(telegramConnectTokens.token, token))
  return upsertNotificationChannel(record.userId, 'telegram', chatId, username, true)
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

export async function getPositions(userId: string): Promise<Position[]> {
  if (!hasDatabase()) return memory.positions.get(userId) ?? []
  const rows = await getDb().select().from(positions).where(eq(positions.userId, userId)).orderBy(desc(positions.createdAt))
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    opportunityId: row.opportunityId,
    platform: row.platform,
    asset: row.asset,
    chain: row.chain,
    amountUsd: Number(row.amountUsd),
    entryApy: Number(row.entryApy),
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function addPosition(userId: string, input: Omit<Position, 'id' | 'userId' | 'createdAt'>) {
  const current = await getPositions(userId)
  if (current.length >= POSITION_LIMIT) return { ok: false as const, error: `Beta portfolio limit is ${POSITION_LIMIT} positions.` }
  const position: Position = { ...input, id: id('pos'), userId, createdAt: new Date().toISOString() }
  if (!hasDatabase()) {
    memory.positions.set(userId, [position, ...current])
    return { ok: true as const, positions: await getPositions(userId) }
  }
  await getDb().insert(positions).values({
    id: position.id,
    userId,
    opportunityId: position.opportunityId,
    platform: position.platform,
    asset: position.asset,
    chain: position.chain,
    amountUsd: String(position.amountUsd),
    entryApy: String(position.entryApy),
  })
  return { ok: true as const, positions: await getPositions(userId) }
}

export async function removePosition(userId: string, positionId: string) {
  if (!hasDatabase()) {
    const next = (memory.positions.get(userId) ?? []).filter((item) => item.id !== positionId)
    memory.positions.set(userId, next)
    return next
  }
  await getDb().delete(positions).where(sql`${positions.id} = ${positionId} and ${positions.userId} = ${userId}`)
  return getPositions(userId)
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
    condition: alert.condition,
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
    condition: patch.condition,
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
  if (opportunities.length === 0) return
  await getDb().insert(opportunitiesCache).values(opportunities.map((item) => ({
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
    }))).onConflictDoUpdate({
    target: opportunitiesCache.id,
    set: {
      payloadJson: sql`excluded.payload_json`,
      source: sql`excluded.source`,
      chain: sql`excluded.chain`,
      category: sql`excluded.category`,
      asset: sql`excluded.asset`,
      apy: sql`excluded.apy`,
      tvlUsd: sql`excluded.tvl_usd`,
      riskLevel: sql`excluded.risk_level`,
      confidence: sql`excluded.confidence`,
      lastSeenAt: sql`excluded.last_seen_at`,
    },
  })
}

export async function storeOpportunitySnapshots(opportunities: Opportunity[]) {
  const capturedAt = new Date()
  if (!hasDatabase()) {
    for (const item of opportunities) {
      const snapshots = memory.snapshots.get(item.id) ?? []
      const next: OpportunitySnapshot = {
        opportunityId: item.id,
        capturedAt: capturedAt.toISOString(),
        apy: item.apy,
        apyBase: item.apyBase,
        apyReward: item.apyReward,
        apyPct1D: item.apyPct1D,
        apyMean30d: item.apyMean30d,
        tvlUsd: item.tvlUsd,
      }
      memory.snapshots.set(item.id, [...snapshots.slice(-167), next])
    }
    return
  }

  if (opportunities.length === 0) return
  await getDb().insert(opportunitySnapshots).values(opportunities.map((item) => ({
      id: id('snap'),
      opportunityId: item.id,
      capturedAt,
      apy: String(item.apy),
      apyBase: item.apyBase === undefined ? null : String(item.apyBase),
      apyReward: item.apyReward === undefined ? null : String(item.apyReward),
      apyPct1D: item.apyPct1D === undefined ? null : String(item.apyPct1D),
      apyMean30d: item.apyMean30d === undefined ? null : String(item.apyMean30d),
      tvlUsd: String(item.tvlUsd),
      payloadJson: JSON.stringify(item),
    })))
}

export async function getAllUsersForDigest(): Promise<{ clerkUserId: string; email: string; watchlistIds: string[] }[]> {
  if (!hasDatabase()) return []
  const db = getDb()
  const rows = await db.select().from(users)
  const eligible = rows
    .map((row) => ({ clerkUserId: row.clerkUserId, email: row.email, settings: parseSettings(row.settingsJson) }))
    .filter((u) => u.settings.digestEnabled && u.email)
  const results = await Promise.all(
    eligible.map(async (u) => {
      const watchlist = await getWatchlist(u.clerkUserId)
      return { clerkUserId: u.clerkUserId, email: u.email as string, watchlistIds: watchlist }
    }),
  )
  return results
}

export async function getCachedOpportunities() {
  if (!hasDatabase()) return memory.opportunities
  const rows = await getDb().select().from(opportunitiesCache).orderBy(desc(opportunitiesCache.lastSeenAt))
  return rows.map((row) => JSON.parse(row.payloadJson) as Opportunity)
}

export async function getCachedOpportunityById(opportunityId: string) {
  const items = await getCachedOpportunities()
  return items.find((item) => item.id === opportunityId) ?? null
}

export async function getOpportunitySnapshots(opportunityId: string, limit = 48) {
  if (!hasDatabase()) return (memory.snapshots.get(opportunityId) ?? []).slice(-limit)
  const rows = await getDb()
    .select()
    .from(opportunitySnapshots)
    .where(eq(opportunitySnapshots.opportunityId, opportunityId))
    .orderBy(desc(opportunitySnapshots.capturedAt))
    .limit(limit)
  return rows
    .map((row) => ({
      opportunityId: row.opportunityId,
      capturedAt: row.capturedAt.toISOString(),
      apy: Number(row.apy),
      apyBase: row.apyBase === null ? undefined : Number(row.apyBase),
      apyReward: row.apyReward === null ? undefined : Number(row.apyReward),
      apyPct1D: row.apyPct1D === null ? undefined : Number(row.apyPct1D),
      apyMean30d: row.apyMean30d === null ? undefined : Number(row.apyMean30d),
      tvlUsd: Number(row.tvlUsd),
    }) satisfies OpportunitySnapshot)
    .reverse()
}

export async function getPoolDetail(opportunityId: string): Promise<PoolDetail | null> {
  const opportunity = await getCachedOpportunityById(opportunityId)
  if (!opportunity) return null
  const [allOpportunities, history] = await Promise.all([
    getCachedOpportunities(),
    getOpportunitySnapshots(opportunityId, 72),
  ])

  return {
    opportunity,
    history,
    relatedByProtocol: allOpportunities.filter((item) => item.id !== opportunityId && item.protocolSlug === opportunity.protocolSlug).slice(0, 4),
    relatedByAsset: allOpportunities.filter((item) => item.id !== opportunityId && item.asset === opportunity.asset).slice(0, 4),
    relatedByChain: allOpportunities.filter((item) => item.id !== opportunityId && item.chain === opportunity.chain).slice(0, 4),
  }
}

export async function wasAlertDelivered(deliveryKey: string) {
  if (!hasDatabase()) return memory.deliveries.has(deliveryKey)
  const rows = await getDb().select().from(alertDeliveries).where(eq(alertDeliveries.deliveryKey, deliveryKey)).limit(1)
  return rows.length > 0
}

export async function getAlertActivity(userId: string, limit = 12): Promise<AlertActivity[]> {
  if (!hasDatabase()) return memory.deliveryRecords.filter((item) => item.userId === userId).slice(0, limit)

  const db = getDb()
  const rows = await db
    .select()
    .from(alertDeliveries)
    .where(eq(alertDeliveries.userId, userId))
    .orderBy(desc(alertDeliveries.createdAt))
    .limit(limit)
  if (rows.length === 0) return []

  const [alerts, opportunities, channels] = await Promise.all([
    getAlertRules(userId),
    getCachedOpportunities(),
    getNotificationChannels(userId),
  ])
  const alertMap = new Map(alerts.map((alert) => [alert.id, alert]))
  const opportunityMap = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]))
  const channelLabel = channels
    .filter((channel) => channel.enabled && channel.verified)
    .map((channel) => channel.type === 'telegram' ? 'Telegram' : 'Email')
    .join(' + ') || 'Notification'

  return rows.map((row) => {
    const alert = alertMap.get(row.alertId)
    const opportunity = opportunityMap.get(row.opportunityId)
    return {
      id: row.id,
      alertId: row.alertId,
      alertName: alert?.name ?? 'Alert rule',
      opportunityId: row.opportunityId,
      poolName: opportunity?.name ?? row.opportunityId,
      platform: opportunity?.platform ?? 'Unknown pool',
      asset: opportunity?.asset ?? alert?.asset ?? 'YIELD',
      chain: opportunity?.chain ?? alert?.chain ?? 'All chains',
      apy: opportunity?.apy ?? alert?.minApy ?? 0,
      channel: channelLabel,
      createdAt: row.createdAt.toISOString(),
    } satisfies AlertActivity
  })
}

export async function recordAlertDelivery(userId: string, alertId: string, opportunityId: string, deliveryKey: string, activity?: Omit<AlertActivity, 'id' | 'createdAt'>) {
  if (!hasDatabase()) {
    memory.deliveries.add(deliveryKey)
    if (activity) {
      memory.deliveryRecords.unshift({
        ...activity,
        id: id('activity'),
        userId,
        createdAt: new Date().toISOString(),
      })
      memory.deliveryRecords = memory.deliveryRecords.slice(0, 50)
    }
    return
  }
  await getDb().insert(alertDeliveries).values({ id: id('delivery'), userId, alertId, opportunityId, deliveryKey }).onConflictDoNothing()
}
