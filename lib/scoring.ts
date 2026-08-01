import { getProtocolMeta, llamaProtocolIcon, normalizeProtocolSlug } from './protocols'
import { computeSafetyGrade } from './grade'
import type { LlamaPool, Opportunity, LitmusScoreBreakdown, RiskLevel } from './types'

/** Inputs to the four Safety-Grade dimensions — shared by the live scan and the backtest. */
export type ScoreInputs = {
  apy: number
  apyBase?: number
  apyReward?: number
  apyPct1D?: number
  apyMean30d?: number
  tvl: number
}

/**
 * The four transparent scoring dimensions. Extracted so the historical backtest
 * recomputes grades with the EXACT same model the live scan uses.
 */
export function computeScoreBreakdown(i: ScoreInputs): LitmusScoreBreakdown {
  const liquidity = Math.min(100, Math.max(30, Math.round(((Math.log10(Math.max(i.tvl, 1_000_000)) - 6) / 3.5) * 65 + 35)))
  const stability = Math.min(100, Math.max(20, Math.round(96 - Math.abs(i.apyPct1D ?? 0) * 6 - Math.max(0, i.apy - 10) * 1.4)))
  const sustainability = Math.min(100, Math.max(24, Math.round(88 - ((i.apyReward ?? 0) / Math.max(i.apy, 1)) * 50 - Math.max(0, i.apy - 12) * 2)))
  const completeness = [i.apyBase !== undefined, i.apyReward !== undefined, i.apyPct1D !== undefined, i.apyMean30d !== undefined].filter(Boolean).length * 25
  return { liquidity, stability, sustainability, completeness }
}

export function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 2 : 0,
  }).format(value)
}

export function formatTvl(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return money(value)
}

export function normalizeSymbol(symbol: string) {
  return symbol.split('-')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'YLD'
}

export function inferCategory(pool: Pick<LlamaPool, 'symbol' | 'stablecoin'>) {
  const symbol = pool.symbol.toUpperCase()
  if (pool.stablecoin || symbol.includes('USDC') || symbol.includes('USDT') || symbol.includes('DAI')) {
    return 'Stablecoin lending'
  }
  if (symbol.includes('SOL') || symbol.includes('ETH') || symbol.includes('STETH')) return 'Staking'
  return 'Stablecoin lending'
}

export function poolToOpportunity(pool: LlamaPool, index: number): Opportunity {
  const apy = Number(pool.apy ?? pool.apyBase ?? 0)
  const apyBase = pool.apyBase === undefined ? undefined : Number(pool.apyBase)
  const apyReward = pool.apyReward === undefined ? undefined : Number(pool.apyReward)
  const apyPct1D = pool.apyPct1D === undefined ? undefined : Number(pool.apyPct1D)
  const apyPct7D = pool.apyPct7D === undefined ? undefined : Number(pool.apyPct7D)
  const apyPct30D = pool.apyPct30D === undefined ? undefined : Number(pool.apyPct30D)
  const apyMean30d = pool.apyMean30d === undefined ? undefined : Number(pool.apyMean30d)
  const tvl = Number(pool.tvlUsd || 0)
  const volatilityPenalty = Math.abs(Number(pool.apyPct1D ?? 0)) * 1.4
  const rewardPenalty = Number(pool.apyReward ?? 0) > apy * 0.5 ? 6 : 0
  const risk: RiskLevel = tvl >= 50_000_000 && apy <= 12 && volatilityPenalty < 7 ? 'Low' : 'Medium'
  const confidence = Math.min(
    96,
    Math.max(58, Math.round(62 + Math.log10(Math.max(tvl, 10_000)) * 4 - Math.max(0, apy - 12) * 1.6 - volatilityPenalty - rewardPenalty)),
  )
  const { liquidity, stability, sustainability, completeness } = computeScoreBreakdown({ apy, apyBase, apyReward, apyPct1D, apyMean30d, tvl })
  const dailyEstimate = apy / 365
  const project = pool.project
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
  const protocol = getProtocolMeta(project)
  const platform = protocol.name || project
  const symbol = normalizeSymbol(pool.symbol)
  // Raw DeFiLlama slug — matches the icon CDN and /protocols directory exactly
  // (incl. dotted slugs like "ether.fi-stake"), unlike our normalized form.
  const rawSlug = pool.project
  const internalUrl = `/terminal/pools/${encodeURIComponent(`live-${pool.pool}`)}`
  const officialUrl = protocol.officialUrl ?? internalUrl
  const now = new Date().toISOString()

  return {
    id: `live-${pool.pool}`,
    rank: index + 1,
    name: `${symbol} yield pool`,
    platform,
    category: inferCategory(pool),
    chain: pool.chain,
    asset: symbol,
    symbol,
    apy,
    trend: Number(pool.apyPct1D ?? 0) < -0.2 ? 'down' : apy >= 7 ? 'up' : 'flat',
    trendValue: Number(Math.min(9.9, Math.abs(Number(pool.apyPct1D ?? apy / 10))).toFixed(1)),
    risk,
    minimum: 25,
    time: '15 min',
    tvl: formatTvl(tvl),
    tvlUsd: tvl,
    gas: pool.chain === 'Solana' ? '<$0.01' : 'Varies',
    confidence,
    dailyLow: dailyEstimate * 0.72,
    dailyHigh: dailyEstimate * 1.08,
    action: 'Visit protocol',
    actionUrl: officialUrl,
    officialUrl,
    sourceUrl: officialUrl,
    logoUrl: protocol.logoUrl ?? llamaProtocolIcon(rawSlug),
    protocolSlug: rawSlug || protocol.slug || normalizeProtocolSlug(project),
    source: 'Live',
    notes: `Market-feed yield pool for ${pool.symbol} on ${pool.chain}. Verify protocol details before depositing.`,
    flags: [
      tvl >= 1_000_000 ? 'TVL above $1M' : 'Lower TVL',
      Number(pool.apyMean30d ?? 0) ? '30d APY history present' : 'Limited APY history',
      risk === 'Low' ? 'Lower-risk screen' : 'Needs review',
    ],
    lastSeenAt: now,
    lastUpdated: now,
    apyBase,
    apyReward,
    apyPct1D,
    apyPct7D,
    apyPct30D,
    apyMean30d,
    volatility: Number(Math.abs(apyPct1D ?? 0).toFixed(2)),
    dataCompleteness: completeness,
    scoreBreakdown: {
      liquidity,
      stability,
      sustainability,
      completeness,
    },
    safety: computeSafetyGrade({ liquidity, stability, sustainability, completeness }),
  }
}
