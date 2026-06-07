import { z } from 'zod'

export const alertRuleInput = z.object({
  name: z.string().trim().min(2).max(80),
  chain: z.string().default('All chains'),
  category: z.string().default('All categories'),
  asset: z.string().trim().max(16).default(''),
  minApy: z.coerce.number().min(0).max(100).default(5),
  maxRisk: z.enum(['Low', 'Medium']).default('Low'),
  minConfidence: z.coerce.number().min(0).max(100).default(80),
  frequency: z.enum(['instant', 'daily', 'weekly']).default('daily'),
  condition: z.enum(['apy-above', 'apy-below', 'apy-drop', 'tvl-drop', 'reward-spike']).default('apy-above'),
  enabled: z.boolean().default(true),
})

export const alertRulePatchInput = alertRuleInput.partial()

export const positionInput = z.object({
  opportunityId: z.string().trim().min(1),
  amountUsd: z.coerce.number().min(1).max(100_000_000),
})

export const settingsInput = z.object({
  capital: z.coerce.number().min(25).max(100_000).optional(),
  chain: z.string().optional(),
  risk: z.string().optional(),
  time: z.string().optional(),
  category: z.string().optional(),
  emailOptIn: z.boolean().optional(),
  disclosureAccepted: z.boolean().optional(),
  digestEnabled: z.boolean().optional(),
  notificationChannels: z.object({
    email: z.boolean().optional(),
    telegram: z.boolean().optional(),
  }).optional(),
})
