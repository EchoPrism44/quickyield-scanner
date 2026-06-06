import type { AlertRule, Opportunity } from './types'

/**
 * Pure predicate: does this opportunity satisfy the alert rule?
 * Supports both upside (apy-above) and downside (apy-below) conditions.
 */
export function alertMatchesOpportunity(alert: AlertRule, item: Opportunity): boolean {
  const riskOk = alert.maxRisk === 'Medium' || item.risk === 'Low'
  const apyOk = alert.condition === 'apy-below' ? item.apy <= alert.minApy : item.apy >= alert.minApy
  return (
    (!alert.chain || alert.chain === 'All chains' || item.chain === alert.chain) &&
    (!alert.category || alert.category === 'All categories' || item.category === alert.category) &&
    (!alert.asset || item.asset.toLowerCase().includes(alert.asset.toLowerCase())) &&
    apyOk &&
    item.confidence >= alert.minConfidence &&
    riskOk
  )
}
