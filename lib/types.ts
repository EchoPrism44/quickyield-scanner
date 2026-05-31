export type RiskLevel = 'Low' | 'Medium'
export type TimeCost = '5 min' | '15 min' | 'Ongoing'
export type Trend = 'up' | 'down' | 'flat'
export type DataStatus = 'live' | 'fallback'
export type AlertFrequency = 'instant' | 'daily' | 'weekly'
export type NotificationChannelType = 'email' | 'telegram'

export type QuickYieldScoreBreakdown = {
  liquidity: number
  stability: number
  sustainability: number
  completeness: number
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
  apyMean30d?: number
  volatility: number
  dataCompleteness: number
  scoreBreakdown: QuickYieldScoreBreakdown
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

export type OpportunityPreset = 'safe-stablecoins' | 'eth-staking' | 'solana-yield' | 'high-apy' | 'saved'

export type OpportunitiesResult = {
  opportunities: Opportunity[]
  total: number
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
}

export type DashboardUser = {
  id: string
  name: string
  email: string
  imageUrl?: string
  isLocal: boolean
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
  enabled: boolean
  createdAt: string
}

export type DashboardData = {
  user: DashboardUser
  opportunities: Opportunity[]
  total: number
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

export type PoolDetail = {
  opportunity: Opportunity
  history: OpportunitySnapshot[]
  relatedByProtocol: Opportunity[]
  relatedByAsset: Opportunity[]
  relatedByChain: Opportunity[]
}
