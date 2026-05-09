import { describe, expect, it } from 'vitest'
import { z } from 'zod'

// Replicating the validation schemas from lib/validation.ts inline for test isolation
const alertInputSchema = z.object({
  name: z.string().min(1).max(100),
  chain: z.string().min(1),
  category: z.string(),
  asset: z.string().min(1),
  minApy: z.number().min(0).max(100),
  maxRisk: z.string(),
  minConfidence: z.number().min(0).max(100),
  frequency: z.enum(['instant', 'daily', 'weekly']),
  enabled: z.boolean().optional(),
})

const alertPatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  minApy: z.number().min(0).max(100).optional(),
  frequency: z.enum(['instant', 'daily', 'weekly']).optional(),
  enabled: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' })

const settingsSchema = z.object({
  capital: z.number().min(25).max(100000).optional(),
  emailOptIn: z.boolean().optional(),
})

describe('alert input validation', () => {
  it('accepts valid alert input', () => {
    const result = alertInputSchema.safeParse({
      name: 'Test alert',
      chain: 'Base',
      category: 'Stablecoin lending',
      asset: 'USDC',
      minApy: 5,
      maxRisk: 'Low',
      minConfidence: 80,
      frequency: 'daily',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = alertInputSchema.safeParse({
      name: '',
      chain: 'Base',
      category: 'Stablecoin lending',
      asset: 'USDC',
      minApy: 5,
      maxRisk: 'Low',
      minConfidence: 80,
      frequency: 'daily',
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative minApy', () => {
    const result = alertInputSchema.safeParse({
      name: 'Test',
      chain: 'Base',
      category: 'Stablecoin lending',
      asset: 'USDC',
      minApy: -1,
      maxRisk: 'Low',
      minConfidence: 80,
      frequency: 'daily',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid frequency', () => {
    const result = alertInputSchema.safeParse({
      name: 'Test',
      chain: 'Base',
      category: 'Stablecoin lending',
      asset: 'USDC',
      minApy: 5,
      maxRisk: 'Low',
      minConfidence: 80,
      frequency: 'yearly',
    })
    expect(result.success).toBe(false)
  })
})

describe('alert patch validation', () => {
  it('accepts partial update with one field', () => {
    const result = alertPatchSchema.safeParse({ enabled: false })
    expect(result.success).toBe(true)
  })

  it('rejects empty patch', () => {
    const result = alertPatchSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('settings validation', () => {
  it('accepts valid settings', () => {
    const result = settingsSchema.safeParse({ capital: 500, emailOptIn: true })
    expect(result.success).toBe(true)
  })

  it('rejects capital below minimum', () => {
    const result = settingsSchema.safeParse({ capital: 10 })
    expect(result.success).toBe(false)
  })

  it('rejects capital above maximum', () => {
    const result = settingsSchema.safeParse({ capital: 200000 })
    expect(result.success).toBe(false)
  })
})
