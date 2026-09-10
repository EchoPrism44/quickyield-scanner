import { boolean, integer, numeric, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email'),
  settingsJson: text('settings_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

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
}).enableRLS()

export const opportunitySnapshots = pgTable('opportunity_snapshots', {
  id: text('id').primaryKey(),
  opportunityId: text('opportunity_id').notNull(),
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
  apy: numeric('apy').notNull(),
  apyBase: numeric('apy_base'),
  apyReward: numeric('apy_reward'),
  apyPct1D: numeric('apy_pct_1d'),
  apyMean30d: numeric('apy_mean_30d'),
  tvlUsd: numeric('tvl_usd').notNull(),
}).enableRLS()

export const watchlistItems = pgTable(
  'watchlist_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    opportunityId: text('opportunity_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('watchlist_user_opportunity_idx').on(table.userId, table.opportunityId)],
).enableRLS()

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
  condition: text('condition').default('apy-above').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

export const positions = pgTable('positions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  opportunityId: text('opportunity_id').notNull(),
  platform: text('platform').notNull(),
  asset: text('asset').notNull(),
  chain: text('chain').notNull(),
  amountUsd: numeric('amount_usd').notNull(),
  entryApy: numeric('entry_apy').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

export const alertDeliveries = pgTable('alert_deliveries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  alertId: text('alert_id').notNull(),
  opportunityId: text('opportunity_id').notNull(),
  deliveryKey: text('delivery_key').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

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
).enableRLS()

export const telegramConnectTokens = pgTable('telegram_connect_tokens', {
  token: text('token').primaryKey(),
  userId: text('user_id').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

export const interactionEvents = pgTable('interaction_events', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  payloadJson: text('payload_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

export const assessmentLeads = pgTable('assessment_leads', {
  id: text('id').primaryKey(),
  protocol: text('protocol').notNull(),
  pool: text('pool').notNull(),
  chain: text('chain').notNull(),
  poolId: text('pool_id'),
  llamaUrl: text('llama_url'),
  tvlUsd: numeric('tvl_usd'),
  requesterName: text('requester_name').notNull(),
  workEmail: text('work_email').notNull(),
  role: text('role'),
  tier: text('tier').notNull(),
  timing: text('timing'),
  notes: text('notes'),
  status: text('status').notNull().default('submitted'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

export const assessments = pgTable('assessments', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull(),
  slug: text('slug').notNull().unique(),
  protocol: text('protocol').notNull(),
  pool: text('pool').notNull(),
  chain: text('chain').notNull(),
  assessedAt: timestamp('assessed_at').notNull(),
  methodologyVersion: text('methodology_version').notNull(),
  gradeLetter: text('grade_letter').notNull(),
  gradeScore: integer('grade_score').notNull(),
  gradeLabel: text('grade_label').notNull(),
  gradeSummary: text('grade_summary').notNull(),
  weakestSignal: text('weakest_signal').notNull(),
  signalsJson: text('signals_json').notNull(),
  strengthsJson: text('strengths_json').notNull(),
  watchpointsJson: text('watchpoints_json').notNull(),
  summary: text('summary').notNull(),
  status: text('status').notNull().default('factual_review'),
  factualReviewDeadline: timestamp('factual_review_deadline'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()