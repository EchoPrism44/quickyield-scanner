'use client'

import { Bell, Mail, ShieldCheck } from 'lucide-react'
import type { DashboardUser, NotificationStatus, UserSettings } from '../../lib/types'

export function SettingsView({
  user,
  notifications,
  capital,
  setCapital,
  onSave,
  onToggleChannel,
  onConnectTelegram,
  onSendTest,
  testingNotification,
  digestEnabled,
}: {
  user: DashboardUser
  notifications: NotificationStatus
  capital: number
  setCapital: (value: number) => void
  onSave: (settings: Partial<UserSettings>) => Promise<void>
  onToggleChannel: (type: 'email' | 'telegram', enabled: boolean) => Promise<void>
  onConnectTelegram: () => Promise<void>
  onSendTest: () => Promise<void>
  testingNotification: boolean
  digestEnabled: boolean
}) {
  return (
    <section className="qy-page" data-testid="settings-page">
      <div className="qy-page-header">
        <span className="qy-overline qy-overline-signal">Account</span>
        <h1>Settings</h1>
        <p>Notification and sizing defaults for this account.</p>
      </div>

      <div className="qy-settings-shell">
        <section className="qy-set-section">
          <h3>Profile</h3>
          <p>Signed in as {user.email}. Watchlists and alerts are scoped to this account only.</p>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Tracked capital</strong>
              <span>Used for projected sizing and quick comparisons.</span>
            </div>
            <input
              className="qy-input"
              style={{ width: 120 }}
              type="number"
              aria-label="Tracked capital"
              min={25}
              max={100000}
              value={capital}
              onChange={(event) => setCapital(Number(event.target.value))}
              onBlur={() => onSave({ capital })}
            />
          </div>
        </section>

        <section className="qy-set-section">
          <h3>Notifications</h3>
          <p>Telegram is the fastest route. Email stays available as a backup record.</p>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Email</strong>
              <span>{notifications.email.destination ?? 'Uses your Clerk email when available.'}</span>
            </div>
            <button
              type="button"
              className={`qy-toggle ${notifications.email.enabled ? 'on' : ''}`}
              role="switch"
              aria-checked={notifications.email.enabled}
              aria-label="Toggle email alerts"
              onClick={() => onToggleChannel('email', !notifications.email.enabled)}
            />
          </div>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Telegram</strong>
              <span>{notifications.telegram.connected ? `Connected${notifications.telegram.username ? ` as ${notifications.telegram.username}` : ''}` : 'Connect your Telegram bot chat for faster alerts.'}</span>
            </div>
            {notifications.telegram.connected ? (
              <button
                type="button"
                className={`qy-toggle ${notifications.telegram.enabled ? 'on' : ''}`}
                role="switch"
                aria-checked={notifications.telegram.enabled}
                aria-label="Toggle Telegram alerts"
                onClick={() => onToggleChannel('telegram', !notifications.telegram.enabled)}
              />
            ) : (
              <button type="button" className="qy-btn qy-btn-secondary" onClick={onConnectTelegram}>Connect Telegram</button>
            )}
          </div>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Test alert</strong>
              <span>Send one sample alert to enabled verified channels.</span>
            </div>
            <button type="button" className="qy-btn qy-btn-secondary" onClick={onSendTest} disabled={testingNotification}>
              <Bell size={14} />
              {testingNotification ? 'Sending...' : 'Send test alert'}
            </button>
          </div>
        </section>

        <section className="qy-set-section">
          <h3><Mail size={16} /> Weekly digest</h3>
          <p>Every Sunday morning — your watchlist APYs, grade changes, and the top 3 safe picks of the week.</p>
          <div className="qy-set-row">
            <div className="qy-set-row-info">
              <strong>Safe Yield digest</strong>
              <span>Sent to {user.email} each Sunday at 08:00 UTC.</span>
            </div>
            <button
              type="button"
              className={`qy-toggle ${digestEnabled ? 'on' : ''}`}
              role="switch"
              aria-checked={digestEnabled}
              aria-label="Toggle weekly digest"
              onClick={() => onSave({ digestEnabled: !digestEnabled })}
            />
          </div>
        </section>

        <section className="qy-set-section">
          <h3><ShieldCheck size={16} /> Method</h3>
          <p>QuickYield combines live market-feed data with internal ranking, data completeness, and volatility screens. It is a research product, not an execution product.</p>
        </section>
      </div>
    </section>
  )
}
