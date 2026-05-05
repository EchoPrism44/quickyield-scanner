import type { LlamaPool, Opportunity, RiskLevel } from './types'

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
  const tvl = Number(pool.tvlUsd || 0)
  const volatilityPenalty = Math.abs(Number(pool.apyPct1D ?? 0)) * 1.4
  const rewardPenalty = Number(pool.apyReward ?? 0) > apy * 0.5 ? 6 : 0
  const risk: RiskLevel = tvl >= 50_000_000 && apy <= 12 && volatilityPenalty < 7 ? 'Low' : 'Medium'
  const confidence = Math.min(
    96,
    Math.max(58, Math.round(62 + Math.log10(Math.max(tvl, 10_000)) * 4 - Math.max(0, apy - 12) * 1.6 - volatilityPenalty - rewardPenalty)),
  )
  const dailyEstimate = apy / 365
  const project = pool.project
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
  const symbol = normalizeSymbol(pool.symbol)

  return {
    id: `live-${pool.pool}`,
    rank: index + 1,
    name: `${symbol} yield pool`,
    platform: project,
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
    action: 'Open live pool data',
    actionUrl: `https://defillama.com/yields/pool/${pool.pool}`,
    source: 'Live',
    notes: `Live DeFiLlama pool for ${pool.symbol} on ${pool.chain}. Verify protocol details, contract risk, and withdrawal terms before using it.`,
    flags: [
      'Live DeFiLlama data',
      tvl >= 1_000_000 ? 'TVL above $1M' : 'Lower TVL',
      Number(pool.apyMean30d ?? 0) ? '30d APY history present' : 'Limited APY history',
      risk === 'Low' ? 'Lower-risk screen' : 'Needs review',
    ],
    lastSeenAt: new Date().toISOString(),
  }
}
