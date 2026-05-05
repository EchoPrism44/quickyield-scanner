import { defaultSettings } from './constants'
import type { AlertRule, Opportunity, UserSettings } from './types'

export const memory = {
  opportunities: [] as Opportunity[],
  watchlists: new Map<string, string[]>([['local-beta-user', ['curated-jito-sol', 'curated-aave-usdc-base']]]),
  settings: new Map<string, UserSettings>([['local-beta-user', defaultSettings]]),
  alerts: new Map<string, AlertRule[]>([
    [
      'local-beta-user',
      [
        {
          id: 'local-alert-base-stables',
          userId: 'local-beta-user',
          name: 'Base stablecoins above 6%',
          chain: 'Base',
          category: 'Stablecoin lending',
          asset: 'USDC',
          minApy: 6,
          maxRisk: 'Low',
          minConfidence: 80,
          frequency: 'daily',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
    ],
  ]),
  deliveries: new Set<string>(),
}
