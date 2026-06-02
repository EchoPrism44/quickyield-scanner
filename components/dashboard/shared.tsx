'use client'

import { useEffect, useState } from 'react'
import { fetchSparkline, renderSparklineSvg } from '../../lib/chart'
import { safetyGradeOf } from '../../lib/grade'
import type { Opportunity } from '../../lib/types'

export function GradeChip({ item, showLabel = true }: { item: Opportunity; showLabel?: boolean }) {
  const g = safetyGradeOf(item)
  return (
    <span className="qy-grade-cell" title={`Safety Grade ${g.letter} (${g.score}/100) — ${g.summary}`}>
      <span className={`qy-grade qy-grade-${g.letter.toLowerCase()}`}>{g.letter}</span>
      {showLabel ? <small>{g.label}</small> : null}
    </span>
  )
}

export function SparklineCell({ poolId }: { poolId: string }) {
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchSparkline(poolId).then((data) => {
      if (!cancelled) setSvg(renderSparklineSvg(data))
    })
    return () => { cancelled = true }
  }, [poolId])

  if (!svg) return <span className="qy-sparkline-placeholder">--</span>
  return <span className="qy-sparkline" dangerouslySetInnerHTML={{ __html: svg }} />
}
