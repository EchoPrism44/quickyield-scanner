import { describe, it, expect } from 'vitest'
import { computeSafetyGrade, safetyGradeOf, gradeTone } from '../lib/grade'
import type { SafetyGrade } from '../lib/types'

const bd = (liquidity: number, stability: number, sustainability: number, completeness: number) => ({
  liquidity, stability, sustainability, completeness,
})

describe('computeSafetyGrade', () => {
  it('grades a strong pool A', () => {
    const g = computeSafetyGrade(bd(98, 92, 86, 94))
    expect(g.letter).toBe('A')
    expect(g.score).toBeGreaterThanOrEqual(85)
  })

  it('grades a weak pool F', () => {
    expect(computeSafetyGrade(bd(30, 20, 24, 0)).letter).toBe('F')
  })

  it('maps band boundaries (equal weights sum to 1, so score == value)', () => {
    expect(computeSafetyGrade(bd(85, 85, 85, 85)).letter).toBe('A')
    expect(computeSafetyGrade(bd(72, 72, 72, 72)).letter).toBe('B')
    expect(computeSafetyGrade(bd(71, 71, 71, 71)).letter).toBe('C')
    expect(computeSafetyGrade(bd(60, 60, 60, 60)).letter).toBe('C')
    expect(computeSafetyGrade(bd(45, 45, 45, 45)).letter).toBe('D')
    expect(computeSafetyGrade(bd(44, 44, 44, 44)).letter).toBe('F')
  })

  it('identifies the weakest factor', () => {
    expect(computeSafetyGrade(bd(90, 90, 40, 90)).weakest).toBe('reward quality')
    expect(computeSafetyGrade(bd(40, 90, 90, 90)).weakest).toBe('liquidity')
  })

  it('clamps and rounds the composite score to 0-100', () => {
    const g = computeSafetyGrade(bd(100, 100, 100, 100))
    expect(g.score).toBe(100)
    expect(g.letter).toBe('A')
  })
})

describe('safetyGradeOf', () => {
  it('prefers a precomputed safety grade', () => {
    const safety: SafetyGrade = { letter: 'A', score: 99, label: 'Very safe', summary: '', weakest: 'liquidity' }
    expect(safetyGradeOf({ safety, scoreBreakdown: bd(0, 0, 0, 0) }).score).toBe(99)
  })

  it('falls back to computing from the breakdown', () => {
    expect(safetyGradeOf({ scoreBreakdown: bd(72, 72, 72, 72) }).letter).toBe('B')
  })
})

describe('gradeTone', () => {
  it('lowercases the letter for css class suffixes', () => {
    expect(gradeTone('A')).toBe('a')
    expect(gradeTone('F')).toBe('f')
  })
})
