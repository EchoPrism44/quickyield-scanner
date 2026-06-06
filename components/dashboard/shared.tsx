'use client'

import { useEffect, useState } from 'react'
import { fetchSparkline, renderSparklineSvg } from '../../lib/chart'
import { safetyGradeOf } from '../../lib/grade'
import type { Opportunity, SafetyGrade } from '../../lib/types'

export function GradeBadge({ grade, showLabel = true }: { grade: SafetyGrade; showLabel?: boolean }) {
  return (
    <span className="qy-grade-cell" title={`Safety Grade ${grade.letter} (${grade.score}/100) — ${grade.summary}`}>
      <span className={`qy-grade qy-grade-${grade.letter.toLowerCase()}`}>{grade.letter}</span>
      {showLabel ? <small>{grade.label}</small> : null}
    </span>
  )
}

export function GradeChip({ item, showLabel = true }: { item: Opportunity; showLabel?: boolean }) {
  return <GradeBadge grade={safetyGradeOf(item)} showLabel={showLabel} />
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
