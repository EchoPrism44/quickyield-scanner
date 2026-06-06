import { describe, expect, it, beforeEach } from 'vitest'
import type { UserSettings, AlertRule } from '../lib/types'

// In-memory store tests — tests the store logic shape without a database
function createMemoryStore() {
  const settings = new Map<string, UserSettings>()
  const alerts = new Map<string, AlertRule[]>()
  const watchlist = new Map<string, string[]>()

  return {
    getSettings: (userId: string) => settings.get(userId) ?? null,
    saveSettings: (userId: string, s: UserSettings) => { settings.set(userId, s) },
    getAlerts: (userId: string) => alerts.get(userId) ?? [],
    saveAlerts: (userId: string, a: AlertRule[]) => { alerts.set(userId, a) },
    getWatchlist: (userId: string) => watchlist.get(userId) ?? [],
    saveWatchlist: (userId: string, w: string[]) => { watchlist.set(userId, w) },
  }
}

const defaultSettings: UserSettings = {
  capital: 100,
  chain: 'All chains',
  risk: 'All risk',
  time: 'Any time',
  category: 'All categories',
  emailOptIn: true,
  disclosureAccepted: false,
  digestEnabled: true,
}

describe('store CRUD operations', () => {
  let store: ReturnType<typeof createMemoryStore>

  beforeEach(() => {
    store = createMemoryStore()
  })

  it('returns default values for new users', () => {
    expect(store.getSettings('user-1')).toBeNull()
    expect(store.getAlerts('user-1')).toEqual([])
    expect(store.getWatchlist('user-1')).toEqual([])
  })

  it('saves and retrieves settings', () => {
    store.saveSettings('user-1', { ...defaultSettings, capital: 500 })
    const s = store.getSettings('user-1')
    expect(s).not.toBeNull()
    expect(s!.capital).toBe(500)
  })

  it('saves and retrieves alerts', () => {
    const alert: AlertRule = {
      id: 'a-1',
      userId: 'user-1',
      name: 'Test alert',
      chain: 'Base',
      category: 'Stablecoin lending',
      asset: 'USDC',
      minApy: 5,
      maxRisk: 'Low',
      minConfidence: 80,
      frequency: 'daily',
      condition: 'apy-above',
      enabled: true,
      createdAt: new Date().toISOString(),
    }
    store.saveAlerts('user-1', [alert])
    const a = store.getAlerts('user-1')
    expect(a).toHaveLength(1)
    expect(a[0].name).toBe('Test alert')
  })

  it('saves and retrieves watchlist', () => {
    store.saveWatchlist('user-1', ['pool-1', 'pool-2'])
    const w = store.getWatchlist('user-1')
    expect(w).toEqual(['pool-1', 'pool-2'])
  })

  it('isolates data between users', () => {
    store.saveSettings('user-1', { ...defaultSettings, capital: 200 })
    store.saveSettings('user-2', { ...defaultSettings, capital: 500 })
    expect(store.getSettings('user-1')!.capital).toBe(200)
    expect(store.getSettings('user-2')!.capital).toBe(500)
  })

  it('overwrites existing watchlist on save', () => {
    store.saveWatchlist('user-1', ['pool-1'])
    store.saveWatchlist('user-1', ['pool-2'])
    expect(store.getWatchlist('user-1')).toEqual(['pool-2'])
  })
})
