'use client'

import { useEffect, useRef, useState } from 'react'
import { useCountUp } from '../../hooks/use-count-up'

/**
 * Count-up stat that starts when it scrolls into view.
 * `value` must be a real, computed number — never a marketing guess.
 */
export function StatCounter({
  value,
  prefix = '',
  suffix = '',
  className,
  duration = 1100,
}: {
  value: number
  prefix?: string
  suffix?: string
  className?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [active, setActive] = useState(false)
  const shown = useCountUp(value, active, duration)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          obs.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString()}
      {suffix}
    </span>
  )
}
