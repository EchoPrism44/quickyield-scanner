import { defaultSettings } from './constants'
import type { AlertRule, NotificationChannel, Opportunity, UserSettings } from './types'

export const memory = {
  opportunities: [] as Opportunity[],
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
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
    ],
  ]),
  deliveries: new Set<string>(),
}
