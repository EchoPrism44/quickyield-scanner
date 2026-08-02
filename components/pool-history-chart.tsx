'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PoolChartPoint } from '../lib/chart'

type Range = '30d' | '90d' | 'all'
type Metric = 'apy' | 'tvl'

const RANGES: { key: Range; label: string; days: number }[] = [
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
  { key: 'all', label: 'All', days: Infinity },
]

function fmtUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${Math.round(value)}`
}

function fmtDate(t: number): string {
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function PoolHistoryChart({ data, source }: { data: PoolChartPoint[]; source: 'live' | 'snapshots' }) {
  const [range, setRange] = useState<Range>('30d')
  const [metric, setMetric] = useState<Metric>('apy')

  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? 30
    if (days === Infinity || data.length === 0) return data
    // Anchor the window to the latest data point (deterministic; daily history).
    const latest = data[data.length - 1].t
    const cutoff = latest - days * 24 * 60 * 60 * 1000
    const slice = data.filter((d) => d.t >= cutoff)
    return slice.length >= 2 ? slice : data.slice(-Math.min(data.length, 30))
  }, [data, range])

  const isApy = metric === 'apy'
  const stroke = isApy ? '#ff6b35' : '#38d5ff'
  const values = filtered.map((d) => (isApy ? d.apy : d.tvlUsd))
  const first = values[0] ?? 0
  const last = values.at(-1) ?? 0
  const change = first ? ((last - first) / first) * 100 : 0

  if (data.length < 2) {
    return (
      <div className="qy-empty">
        <h3>History is still building</h3>
        <p>This pool doesn&apos;t have enough history yet — it fills in as data accumulates.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['apy', 'tvl'] as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`qy-chip ${metric === m ? 'active-signal' : ''}`}
              onClick={() => setMetric(m)}
              aria-pressed={metric === m}
            >
              {m === 'apy' ? 'APY' : 'TVL'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="qy-mono" style={{ fontSize: 13, color: change >= 0 ? '#34d399' : '#f87171' }}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}% {range === 'all' ? 'all time' : `over ${range}`}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`qy-chip ${range === r.key ? 'active-signal' : ''}`}
                onClick={() => setRange(r.key)}
                aria-pressed={range === r.key}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="qyHistFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              scale="time"
              tickFormatter={fmtDate}
              stroke="#8baabf"
              fontSize={11}
              minTickGap={40}
            />
            <YAxis
              stroke="#8baabf"
              fontSize={11}
              width={52}
              tickFormatter={(v) => (isApy ? `${Number(v).toFixed(1)}%` : fmtUsd(Number(v)))}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d1a2b', border: '1px solid #1a2d42', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: '#8baabf' }}
              labelFormatter={(t) => new Date(Number(t)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              formatter={(value) => [isApy ? `${Number(value).toFixed(2)}%` : fmtUsd(Number(value)), isApy ? 'APY' : 'TVL']}
            />
            <Area type="monotone" dataKey={isApy ? 'apy' : 'tvlUsd'} stroke={stroke} strokeWidth={2.5} fill="url(#qyHistFill)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="qy-asset-meta" style={{ marginTop: 8 }}>
        {source === 'live' ? 'Real pool history from DeFiLlama.' : 'Built from Litmus snapshots.'} {filtered.length} points shown.
      </p>
    </div>
  )
}
