'use client'

import type { Opportunity } from '../../lib/types'
import { computeSafetyGrade } from '../../lib/grade'

export function DiscoverShowcase({ items }: { items: Opportunity[] }) {
  const displayItems = items.slice(0, 3)

  function gradeFor(item: Opportunity) {
    const letter = (item.safety ?? computeSafetyGrade(item.scoreBreakdown)).letter
    return letter
  }

  function trendText(item: Opportunity) {
    const sign = item.trend === 'down' ? '-' : '+'
    const cls = item.trend === 'down' ? 'ql-down' : 'ql-up'
    return { text: `${sign}${Math.abs(item.trendValue).toFixed(2)}%`, cls }
  }

  return (
    <div className="ql-discover-showcase" aria-label="Discover pools preview">
      <div className="ql-discover-header">
        <span>Top opportunities</span>
        <span className="ql-discover-count">{items.length}+ pools</span>
      </div>
      <div className="ql-discover-items">
        {displayItems.map((item, idx) => {
          const grade = gradeFor(item)
          const trend = trendText(item)
          return (
            <div key={item.id} className="ql-discover-card" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="ql-discover-rank">#{item.rank}</div>
              <div className="ql-discover-info">
                <div className="ql-discover-name">
                  <b>{item.platform}</b>
                  <span>{item.asset}</span>
                </div>
                <div className="ql-discover-meta">{item.chain} · {item.category}</div>
              </div>
              <div className="ql-discover-metrics">
                <div className="ql-metric">
                  <div className="ql-metric-value">{item.apy.toFixed(2)}%</div>
                  <div className="ql-metric-label">APY</div>
                </div>
                <div className="ql-metric">
                  <div className={`ql-metric-value ${grade === 'A' ? 'ql-grade-a' : grade === 'B' ? 'ql-grade-b' : 'ql-grade-c'}`}>
                    {grade}
                  </div>
                  <div className="ql-metric-label">Grade</div>
                </div>
                <div className="ql-metric">
                  <div className={`ql-metric-value ${trend.cls}`}>{trend.text}</div>
                  <div className="ql-metric-label">24h</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
