import { boolean, integer, numeric, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email'),
  settingsJson: text('settings_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const opportunitiesCache = pgTable('opportunities_cache', {
  id: text('id').primaryKey(),
  payloadJson: text('payload_json').notNull(),
  source: text('source').notNull(),
  chain: text('chain').notNull(),
  category: text('category').notNull(),
  asset: text('asset').notNull(),
  apy: numeric('apy').notNull(),
  tvlUsd: numeric('tvl_usd').notNull(),
  riskLevel: text('risk_level').notNull(),
  confidence: integer('confidence').notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
})

export const watchlistItems = pgTable(
  'watchlist_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    opportunityId: text('opportunity_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('watchlist_user_opportunity_idx').on(table.userId, table.opportunityId)],
)

export const alertRules = pgTable('alert_rules', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  chain: text('chain').notNull(),
  category: text('category').notNull(),
  asset: text('asset').notNull(),
  minApy: numeric('min_apy').notNull(),
  maxRisk: text('max_risk').notNull(),
  minConfidence: integer('min_confidence').notNull(),
  frequency: text('frequency').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const alertDeliveries = pgTable('alert_deliveries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  alertId: text('alert_id').notNull(),
  opportunityId: text('opportunity_id').notNull(),
  deliveryKey: text('delivery_key').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const notificationChannels = pgTable(
  'notification_channels',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    type: text('type').notNull(),
    destination: text('destination').notNull(),
    label: text('label'),
    enabled: boolean('enabled').default(true).notNull(),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('notification_user_type_destination_idx').on(table.userId, table.type, table.destination)],
)

export const telegramConnectTokens = pgTable('telegram_connect_tokens', {
  token: text('token').primaryKey(),
  userId: text('user_id').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const interactionEvents = pgTable('interaction_events', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  payloadJson: text('payload_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
