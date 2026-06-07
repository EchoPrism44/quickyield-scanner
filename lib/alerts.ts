import type { AlertRule, Opportunity } from './types'

/** Extra context some downside conditions need beyond a single live snapshot. */
export type AlertContext = {
  /** TVL of this pool at the previous scan, used for tvl-drop. */
  previousTvlUsd?: number
}

/** Reward dependency as a percentage of total APY (0–100). */
export function rewardDependencyPct(item: Opportunity): number {
  if (item.apy <= 0) return 0
  const reward = item.apyReward ?? 0
  return Math.min(100, Math.max(0, (reward / item.apy) * 100))
}

/** Short metric string for an alert's condition, e.g. "≥ 5%" or "TVL −20%". */
export function alertTargetLabel(alert: Pick<AlertRule, 'condition' | 'minApy'>): string {
  switch (alert.condition) {
    case 'apy-below':
      return `APY ≤ ${alert.minApy}%`
    case 'apy-drop':
      return `APY −${alert.minApy}pts/24h`
    case 'tvl-drop':
      return `TVL −${alert.minApy}%`
    case 'reward-spike':
      return `Reward ≥ ${alert.minApy}%`
    case 'apy-above':
    default:
      return `APY ≥ ${alert.minApy}%`
  }
}

/** Does this opportunity match the rule's targeting filters (chain/category/asset)? */
function matchesTargeting(alert: AlertRule, item: Opportunity): boolean {
  return (
    (!alert.chain || alert.chain === 'All chains' || item.chain === alert.chain) &&
    (!alert.category || alert.category === 'All categories' || item.category === alert.category) &&
    (!alert.asset || item.asset.toLowerCase().includes(alert.asset.toLowerCase()))
  )
}

/**
 * Pure predicate: does this opportunity satisfy the alert rule?
 *
 * Supported conditions (all reuse `minApy` as the numeric threshold):
 * - apy-above: APY rises to/above threshold (upside discovery)
 * - apy-below: APY falls to/below threshold (downside watch)
 * - apy-drop: APY fell by >= threshold points in the last 24h (apyPct1D)
 * - tvl-drop: TVL fell by >= threshold% since the previous scan (needs context)
 * - reward-spike: reward share of APY is >= threshold% (incentive-dependent / trap)
 *
 * Upside (apy-above) and apy-below keep the risk + safety gates so discovery stays
 * high-quality. The other downside conditions skip the safety gate on purpose —
 * degradation usually drags a pool's safety score down, and masking that would
 * defeat the whole point of the alert.
 */
export function alertMatchesOpportunity(alert: AlertRule, item: Opportunity, context?: AlertContext): boolean {
  if (!matchesTargeting(alert, item)) return false

  switch (alert.condition) {
    case 'apy-below': {
      const riskOk = alert.maxRisk === 'Medium' || item.risk === 'Low'
      return item.apy <= alert.minApy && item.confidence >= alert.minConfidence && riskOk
    }
    case 'apy-drop': {
      if (item.apyPct1D === undefined) return false
      return item.apyPct1D <= -alert.minApy
    }
    case 'tvl-drop': {
      const prev = context?.previousTvlUsd
      if (prev === undefined || prev <= 0) return false
      const dropPct = ((prev - item.tvlUsd) / prev) * 100
      return dropPct >= alert.minApy
    }
    case 'reward-spike': {
      return rewardDependencyPct(item) >= alert.minApy
    }
    case 'apy-above':
    default: {
      const riskOk = alert.maxRisk === 'Medium' || item.risk === 'Low'
      return item.apy >= alert.minApy && item.confidence >= alert.minConfidence && riskOk
    }
  }
}
