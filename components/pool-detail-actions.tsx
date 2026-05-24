'use client'

import { useState } from 'react'
import { Bell, Check, Copy, ExternalLink } from 'lucide-react'
import { AlertTargetDialog, alertDraftFromOpportunity, type AlertDraft } from './alert-target-dialog'
import type { Opportunity } from '../lib/types'

export function PoolDetailActions({
  opportunity,
  initiallyWatched,
}: {
  opportunity: Opportunity
  initiallyWatched: boolean
}) {
  const [watched, setWatched] = useState(initiallyWatched)
  const [copied, setCopied] = useState(false)
  const [alertDraft, setAlertDraft] = useState<AlertDraft | null>(null)

  async function toggleWatch() {
    const response = watched
      ? await fetch(`/api/watchlist/${encodeURIComponent(opportunity.id)}`, { method: 'DELETE' })
      : await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunityId: opportunity.id }),
        })
    if (response.ok) setWatched((current) => !current)
  }

  async function createAlert(draft: AlertDraft) {
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, enabled: true }),
    })
    setAlertDraft(null)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div className="qy-detail-actions">
        <button type="button" className={`qy-btn ${watched ? 'qy-btn-secondary' : 'qy-btn-primary'}`} onClick={toggleWatch}>
          {watched ? <Check size={14} /> : null}
          {watched ? 'Saved to watchlist' : 'Add to watchlist'}
        </button>
        <button type="button" className="qy-btn qy-btn-secondary" onClick={() => setAlertDraft(alertDraftFromOpportunity(opportunity))}>
          <Bell size={14} />
          Set alert target
        </button>
        {opportunity.officialUrl.startsWith('http') ? (
          <a href={opportunity.officialUrl} target="_blank" rel="noreferrer" className="qy-btn qy-btn-primary">
            Continue to protocol
            <ExternalLink size={14} />
          </a>
        ) : null}
        <button type="button" className="qy-btn qy-btn-secondary" onClick={copyLink}>
          <Copy size={14} />
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>
      {alertDraft ? (
        <AlertTargetDialog
          draft={alertDraft}
          onChange={setAlertDraft}
          onClose={() => setAlertDraft(null)}
          onSubmit={createAlert}
        />
      ) : null}
    </>
  )
}
