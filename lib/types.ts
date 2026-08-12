import type { WeekOverWeekDelta } from './snapshot-delta'

export type RiskLevel = 'Low' | 'Medium'
export type TimeCost = '5 min' | '15 min' | 'Ongoing'
export type Trend = 'up' | 'down' | 'flat'
export type DataStatus = 'live' | 'fallback'
export type AlertFrequency = 'instant' | 'daily' | 'weekly'
export type AlertCondition = 'apy-above' | 'apy-below' | 'apy-drop' | 'tvl-drop' | 'reward-spike'
export type NotificationChannelType = 'email' | 'telegram'

export type LitmusScoreBreakdown = {
  liquidity: number
  stability: number
  sustainability: number
  completeness: number
}

export type SafetyGradeLetter = 'A' | 'B' | 'C' | 'D' | 'F'

export type SafetyGrade = {
  letter: SafetyGradeLetter
  score: number
  label: string
  summary: string
  weakest: string
}

export type ProtocolMeta = {
  slug: string
  name: string
  aliases?: string[]
  logoUrl?: string
  officialUrl?: string
}

export type OpportunitySnapshot = {
  opportunityId: string
  capturedAt: string
  apy: number
  apyBase?: number
  apyReward?: number
  apyPct1D?: number
  apyMean30d?: number
  tvlUsd: number
}

export type PoolHistoryPoint = OpportunitySnapshot & {
  tvlFormatted: string
  rewardShare: number
}

export type MarketMapCell = {
  band: string
  minApy: number
  maxApy?: number
  pools: number
  lowerRisk: number
  reviewRisk: number
  totalTvl: number
  avgSafety: number
}

export type ScannerHealth = {
  poolsScanned: number
  chainsCovered: number
  livePools: number
  curatedPools: number
  snapshots24h: number
  latestSnapshotAt?: string
  freshnessMinutes?: number
}

export type GradeBucket = {
  letter: SafetyGradeLetter
  count: number
  pct: number
}

/** A pool whose APY or TVL moved notably — the "what changed" view. */
export type MoverRow = {
  id: string
  platform: string
  asset: string
  chain: string
  apy: number
  grade?: SafetyGradeLetter
  /** Signed change: APY points (24h) for apy movers, TVL % for tvl movers. */
  change: number
}

/** A pool ranked by how steady its yield has been. */
export type StabilityRow = {
  id: string
  platform: string
  asset: string
  chain: string
  apy: number
  grade?: SafetyGradeLetter
  volatility: number
}

export type AnalyticsData = {
  history: Array<{
    time: string
    apy: number
    baseApy: number
    rewardApy: number
    tvl: number
    count: number
  }>
  chains: Array<{
    chain: string
    avgApy: number
    avgSafety: number
    totalTvl: number
    opportunities: number
    lowerRisk: number
  }>
  marketMap: MarketMapCell[]
  scannerHealth: ScannerHealth
  topPools: Pick<Opportunity, 'id' | 'platform' | 'asset' | 'chain' | 'apy' | 'tvlUsd' | 'confidence' | 'volatility'>[]
  gradeDistribution: GradeBucket[]
  apyGainers: MoverRow[]
  apyLosers: MoverRow[]
  tvlOutflows: MoverRow[]
  mostStable: StabilityRow[]
  leastStable: StabilityRow[]
  lastUpdated: string
}

export type Opportunity = {
  id: string
  rank: number
  name: string
  platform: string
  category: string
  chain: string
  asset: string
  symbol: string
  apy: number
  trend: Trend
  trendValue: number
  risk: RiskLevel
  minimum: number
  time: TimeCost
  tvl: string
  tvlUsd: number
  gas: string
  confidence: number
  dailyLow: number
  dailyHigh: number
  action: string
  actionUrl: string
  officialUrl: string
  sourceUrl: string
  logoUrl?: string
  protocolSlug: string
  source: 'Live' | 'Curated'
  notes: string
  rankReason?: string
  flags: string[]
  lastSeenAt: string
  lastUpdated: string
  apyBase?: number
  apyReward?: number
  apyPct1D?: number
  apyPct7D?: number
  apyPct30D?: number
  apyMean30d?: number
  volatility: number
  dataCompleteness: number
  scoreBreakdown: LitmusScoreBreakdown
  safety?: SafetyGrade
}

export type LlamaPool = {
  pool: string
  chain: string
  project: string
  symbol: string
  tvlUsd: number
  apy?: number
  apyBase?: number
  apyReward?: number
  apyMean30d?: number
  apyPct1D?: number
  apyPct7D?: number
  apyPct30D?: number
  stablecoin?: boolean
}

export type OpportunityFilters = {
  chain?: string
  category?: string
  risk?: string
  time?: string
  q?: string
  capital?: number
  preset?: OpportunityPreset
  savedIds?: string[]
  page?: number
  pageSize?: number
}

export type OpportunityPreset = 'safe-stablecoins' | 'eth-staking' | 'solana-yield' | 'rwa' | 'high-apy' | 'saved'

/**
 * Aggregates over the whole filtered result set, not the page that was
 * returned. Computed server-side because the client only ever receives one
 * page — anything derived from `opportunities` describes those rows alone and
 * must not be labelled as describing the market.
 */
export type OpportunityStats = {
  avgApy: number
  totalTvlUsd: number
  saferCount: number
  bestStablecoinApy: number | null
  highestApy: number | null
  apyBands: { band: string; count: number; lowRisk: number; avgSafety: number }[]
}

export type OpportunitiesResult = {
  opportunities: Opportunity[]
  total: number
  chainCount: number
  stats: OpportunityStats
  page: number
  pageSize: number
  hasMore: boolean
  dataStatus: DataStatus
  lastUpdated: string
  fallbackReason?: string
}

export type UserSettings = {
  capital: number
  chain: string
  risk: string
  time: string
  category: string
  emailOptIn: boolean
  disclosureAccepted: boolean
  digestEnabled: boolean
}

export type DashboardUser = {
  id: string
  name: string
  email: string
  imageUrl?: string
  isLocal: boolean
  /** True when the terminal is being browsed without a signed-in user. */
  isAnonymous?: boolean
}

export type NotificationChannel = {
  id: string
  userId: string
  type: NotificationChannelType
  destination: string
  label?: string
  enabled: boolean
  verified: boolean
  createdAt: string
}

export type NotificationStatus = {
  email: {
    enabled: boolean
    destination?: string
    verified: boolean
  }
  telegram: {
    enabled: boolean
    connected: boolean
    username?: string
  }
}

export type AlertRule = {
  id: string
  userId: string
  name: string
  chain: string
  category: string
  asset: string
  minApy: number
  maxRisk: RiskLevel
  minConfidence: number
  frequency: AlertFrequency
  condition: AlertCondition
  enabled: boolean
  createdAt: string
}

export type DashboardData = {
  user: DashboardUser
  opportunities: Opportunity[]
  total: number
  chainCount: number
  stats: OpportunityStats
  page: number
  pageSize: number
  hasMore: boolean
  dataStatus: DataStatus
  lastUpdated: string
  fallbackReason?: string
  watchlist: string[]
  alerts: AlertRule[]
  settings: UserSettings
  notifications: NotificationStatus
  /** Week-over-week grade snapshot diff (Market Pulse strip). Null until a second snapshot exists. */
  weekDelta?: WeekOverWeekDelta | null
}

export type AlertActivity = {
  id: string
  userId?: string
  alertId: string
  alertName: string
  opportunityId: string
  poolName: string
  platform: string
  asset: string
  chain: string
  apy: number
  channel: string
  createdAt: string
}

export type Position = {
  id: string
  userId: string
  opportunityId: string
  platform: string
  asset: string
  chain: string
  amountUsd: number
  entryApy: number
  createdAt: string
}

export type PositionView = Position & {
  current: {
    apy: number
    tvl: string
    safety: SafetyGrade
    logoUrl?: string
  } | null
}

export type PortfolioSummary = {
  positionCount: number
  totalUsd: number
  blendedApy: number
  projectedAnnualUsd: number
}

export type PoolDetail = {
  opportunity: Opportunity
  history: OpportunitySnapshot[]
  relatedByProtocol: Opportunity[]
  relatedByAsset: Opportunity[]
  relatedByChain: Opportunity[]
}
