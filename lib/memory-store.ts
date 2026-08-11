import { defaultSettings } from './constants'
import type { AlertActivity, AlertRule, NotificationChannel, Opportunity, OpportunitySnapshot, Position, UserSettings } from './types'

export const memory = {
  opportunities: [] as Opportunity[],
  /** When `opportunities` was last written, so cache freshness works without a DB. */
  opportunitiesUpdatedAt: null as Date | null,
  snapshots: new Map<string, OpportunitySnapshot[]>(),
  positions: new Map<string, Position[]>(),
  watchlists: new Map<string, string[]>([['local-beta-user', ['curated-jito-sol', 'curated-aave-usdc-base']]]),
  settings: new Map<string, UserSettings>([['local-beta-user', defaultSettings]]),
  notificationChannels: new Map<string, NotificationChannel[]>([
    [
      'local-beta-user',
      [
        {
          id: 'local-email-channel',
          userId: 'local-beta-user',
          type: 'email',
          destination: 'local@example.com',
          label: 'Local email',
          enabled: true,
          verified: true,
          createdAt: new Date().toISOString(),
        },
      ],
    ],
  ]),
  telegramConnectTokens: new Map<string, { userId: string; expiresAt: Date; used: boolean }>(),
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
          condition: 'apy-above',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
    ],
  ]),
  deliveries: new Set<string>(),
  deliveryRecords: [] as AlertActivity[],
}
