export type RiskLevel = 'Low' | 'Medium'
export type TimeCost = '5 min' | '15 min' | 'Ongoing'
export type Trend = 'up' | 'down' | 'flat'
export type DataStatus = 'live' | 'fallback'
export type AlertFrequency = 'instant' | 'daily' | 'weekly'

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
  source: 'Live' | 'Curated'
  notes: string
  flags: string[]
  lastSeenAt: string
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
  opportunities: Opportunity[]
  dataStatus: DataStatus
  lastUpdated: string
  fallbackReason?: string
  watchlist: string[]
  alerts: AlertRule[]
  settings: UserSettings
}
