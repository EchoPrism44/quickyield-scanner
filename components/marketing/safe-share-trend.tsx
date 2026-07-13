'use client'

import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { GRADE_LETTERS, type LedgerSnapshotSummary } from '../../lib/ledger-shared'

function TooltipBox({ active, payload, label }: {
  active?: boolean
  label?: string
  payload?: Array<{ value: number }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="ql-chart-tip">
      <div className="ql-chart-tip-date">{label}</div>
      <div className="ql-chart-tip-row">
        <span style={{ background: 'var(--brand-green)' }} />
        {payload[0].value.toFixed(1)}% graded A or B
      </div>
    </div>
  )
}

/** Single-line trend: share of pools graded A or B, per weekly snapshot. */
export function SafeShareTrend({ snapshots }: { snapshots: LedgerSnapshotSummary[] }) {
  const data = useMemo(
    () =>
      snapshots.map((s) => {
        const total = GRADE_LETTERS.reduce((sum, g) => sum + s.dist[g], 0) || 1
        return { date: s.date, safe: ((s.dist.A + s.dist.B) / total) * 100 }
      }),
    [snapshots],
  )

  return (
    <div className="ql-chart">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="safe-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-green)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--brand-green)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: 'var(--ink-mute)', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis unit="%" domain={[0, 100]} tick={{ fill: 'var(--ink-mute)', fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<TooltipBox />} />
          <Area type="monotone" dataKey="safe" stroke="var(--brand-green)" strokeWidth={2} fill="url(#safe-grad)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
