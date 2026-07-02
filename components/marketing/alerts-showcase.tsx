'use client'

import { Bell, Zap } from 'lucide-react'
import type { Opportunity } from '../../lib/types'

export function AlertsShowcase({ items }: { items: Opportunity[] }) {
  const sampleAlerts = [
    {
      id: 'alert-1',
      type: 'APY Rise',
      message: 'STETH on Lido just hit 2.5% APY',
      pool: items[0]?.name || 'STETH yield pool',
      time: '2m ago',
      read: false,
    },
    {
      id: 'alert-2',
      type: 'New Match',
      message: 'crvUSD pool matches your "12%+ APY" rule',
      pool: items[3]?.name || 'crvUSD pool',
      time: '15m ago',
      read: false,
    },
    {
      id: 'alert-3',
      type: 'Risk Warning',
      message: 'TVL on curve pool dropped 8% in 1h',
      pool: 'Curve Finance',
      time: '1h ago',
      read: true,
    },
  ]

  return (
    <div className="ql-alerts-showcase" aria-label="Sample alerts preview">
      <div className="ql-alerts-header">
        <Bell size={18} />
        <span>Alerts</span>
      </div>
      <div className="ql-alerts-list">
        {sampleAlerts.map((alert) => (
          <div key={alert.id} className={`ql-alert-item ${alert.read ? 'ql-alert-read' : 'ql-alert-unread'}`}>
            <div className="ql-alert-badge">
              <Zap size={12} />
            </div>
            <div className="ql-alert-body">
              <div className="ql-alert-type">{alert.type}</div>
              <div className="ql-alert-msg">{alert.message}</div>
              <div className="ql-alert-meta">{alert.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
