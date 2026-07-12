'use client'

import { useEffect, useState } from 'react'

/**
 * Animate a number from 0 to `target` once `active` flips true.
 * Respects `prefers-reduced-motion` by jumping straight to the target.
 */
export function useCountUp(target: number, active: boolean, duration = 1100) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (target <= 0 || reduce) {
      const id = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(id)
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return value
}
