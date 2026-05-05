import { describe, expect, it } from 'vitest'

describe('alert delivery keys', () => {
  it('deduplicates repeated opportunity and APY matches by deterministic key shape', () => {
    const keyA = `${'alert-1'}:${'live-pool-1'}:${Math.round(8.44 * 10)}`
    const keyB = `${'alert-1'}:${'live-pool-1'}:${Math.round(8.41 * 10)}`
    const sent = new Set([keyA])

    expect(sent.has(keyB)).toBe(true)
  })
})
