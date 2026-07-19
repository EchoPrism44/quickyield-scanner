'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { GRADE_LETTERS, type LedgerSnapshotSummary } from '../../lib/ledger-shared'

const GRADE_COLOR: Record<(typeof GRADE_LETTERS)[number], string> = {
  A: 'var(--grade-a)',
  B: 'var(--grade-b)',
  C: 'var(--grade-c)',
  D: 'var(--grade-d)',
  F: 'var(--grade-f)',
}

const GRADE_LABEL: Record<(typeof GRADE_LETTERS)[number], string> = {
  A: 'Very safe', B: 'Safe', C: 'Moderate', D: 'Elevated', F: 'High risk',
}

type Row = { date: string } & Record<(typeof GRADE_LETTERS)[number], number>

function TooltipBox({ active, payload, label }: {
  active?: boolean
  label?: string
  payload?: Array<{ dataKey: string; value: number }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="ql-chart-tip">
      <div className="ql-chart-tip-date">{label}</div>
      {[...payload].reverse().map((p) => (
        <div className="ql-chart-tip-row" key={p.dataKey}>
          <span style={{ background: GRADE_COLOR[p.dataKey as keyof typeof GRADE_COLOR] }} />
          {p.dataKey} · {p.value.toFixed(1)}%
        </div>
      ))}
    </div>
  )
}

/**
 * Stacked-area view of the grade mix across every weekly snapshot —
 * the share of pools at each grade (A–F) over time. Descriptive only.
 */
export function GradeDistributionChart({ snapshots }: { snapshots: LedgerSnapshotSummary[] }) {
  const data = useMemo<Row[]>(
    () =>
      snapshots.map((s) => {
        const total = GRADE_LETTERS.reduce((sum, g) => sum + s.dist[g], 0) || 1
        const row = { date: s.date } as Row
        for (const g of GRADE_LETTERS) row[g] = (s.dist[g] / total) * 100
        return row
      }),
    [snapshots],
  )

  return (
    <div className="ql-chart">
      <div className="ql-chart-legend">
        {GRADE_LETTERS.map((g) => (
          <span className="ql-chart-legend-item" key={g}>
            <i style={{ background: GRADE_COLOR[g] }} />
            <b>{g}</b> {GRADE_LABEL[g]}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 8, right: 14, bottom: 4, left: 6 }}>
          <defs>
            {GRADE_LETTERS.map((g) => (
              <linearGradient id={`grad-${g}`} key={g} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GRADE_COLOR[g]} stopOpacity={0.9} />
                <stop offset="100%" stopColor={GRADE_COLOR[g]} stopOpacity={0.62} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--ink-mute)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: 'var(--ink-mute)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<TooltipBox />} />
          {GRADE_LETTERS.map((g) => (
            <Area
              key={g}
              type="monotone"
              dataKey={g}
              stackId="1"
              stroke={GRADE_COLOR[g]}
              strokeWidth={1.25}
              fill={`url(#grad-${g})`}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
