'use client'

import { Bell, BellOff, CheckCircle2, Target, Trash2 } from 'lucide-react'
import type { AlertActivity, AlertRule } from '../../lib/types'

export function AlertsView({
  alerts,
  activity,
  onDelete,
  onToggle,
  onCreate,
}: {
  alerts: AlertRule[]
  activity: AlertActivity[]
  onDelete: (id: string) => Promise<void>
  onToggle: (alert: AlertRule) => Promise<void>
  onCreate: () => void
}) {
  return (
    <section className="qy-page" data-testid="alerts-page">
      <div className="qy-page-header qy-page-header-row">
        <div>
          <span className="qy-overline qy-overline-signal">Notifications</span>
          <h1>Alerts</h1>
          <p>Rules for yield changes you actually care about, delivered by email or Telegram.</p>
        </div>
        <button type="button" className="qy-btn qy-btn-primary" onClick={onCreate}>
          <Target size={14} />
          New target
        </button>
      </div>
      {alerts.length === 0 ? (
        <div className="qy-empty">
          <Bell className="qy-empty-icon" />
          <h3>No alerts yet</h3>
          <p>Create a target like USDC APY &gt; 15%, Risk &lt;= Medium.</p>
          <button type="button" className="qy-btn qy-btn-secondary qy-empty-action" onClick={onCreate}>
            <Target size={14} />
            Set first target
          </button>
        </div>
      ) : (
        <div className="qy-table-wrap">
          <div className="qy-table-head" style={{ gridTemplateColumns: '4fr 2fr 2fr 2fr 1fr' }}>
            <span>Rule</span>
            <span>Asset</span>
            <span>Target</span>
            <span>Frequency</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>
          {alerts.map((alert) => (
            <div key={alert.id} className="qy-table-row" style={{ gridTemplateColumns: '4fr 2fr 2fr 2fr 1fr', opacity: alert.enabled ? 1 : 0.55 }}>
              <div>
                <div className="qy-asset-name">{alert.name}</div>
                <div className="qy-asset-meta">{alert.asset || 'Any asset'} APY &gt; {alert.minApy}%, Risk &lt;= {alert.maxRisk}</div>
              </div>
              <span className="qy-mono">{alert.asset}</span>
              <span className="qy-num bold">{alert.minApy}% APY</span>
              <span className="qy-mono">{alert.frequency}</span>
              <div className="qy-actions">
                <button type="button" className="qy-icon-btn" onClick={() => onToggle(alert)} aria-label={`${alert.enabled ? 'Pause' : 'Resume'} ${alert.name}`}>{alert.enabled ? <Bell size={14} /> : <BellOff size={14} />}</button>
                <button type="button" className="qy-icon-btn danger" onClick={() => onDelete(alert.id)} aria-label={`Delete ${alert.name}`}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="qy-activity-panel" aria-label="Recent alert activity">
        <div className="qy-detail-panel-head">
          <h2>Activity</h2>
          <span className="qy-mono">{activity.length ? 'Recent deliveries' : 'No deliveries yet'}</span>
        </div>
        {activity.length === 0 ? (
          <p className="qy-detail-copy">When a target matches a scan, the delivery will appear here with the pool, APY, channel, and time.</p>
        ) : (
          <div className="qy-activity-list">
            {activity.map((item) => (
              <div key={item.id} className="qy-activity-row">
                <CheckCircle2 size={16} />
                <div>
                  <strong>{item.alertName}</strong>
                  <span>{item.platform} / {item.asset} / {item.chain}</span>
                </div>
                <div className="qy-terminal-right">
                  <strong>{item.apy.toFixed(2)}%</strong>
                  <span>{item.channel} / {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
