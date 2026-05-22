'use client'

import { useState } from 'react'
import { Bell, Check, Copy, ExternalLink } from 'lucide-react'
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

  async function createAlert() {
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${opportunity.platform} ${opportunity.asset} above ${Math.max(1, Math.floor(opportunity.apy))}%`,
        chain: opportunity.chain,
        category: opportunity.category,
        asset: opportunity.asset,
        minApy: Math.max(1, Math.floor(opportunity.apy)),
        maxRisk: opportunity.risk,
        minConfidence: Math.max(70, opportunity.confidence - 5),
        frequency: 'daily',
        enabled: true,
      }),
    })
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="qy-detail-actions">
      <button type="button" className={`qy-btn ${watched ? 'qy-btn-secondary' : 'qy-btn-primary'}`} onClick={toggleWatch}>
        {watched ? <Check size={14} /> : null}
        {watched ? 'Saved to watchlist' : 'Add to watchlist'}
      </button>
      <button type="button" className="qy-btn qy-btn-secondary" onClick={createAlert}>
        <Bell size={14} />
        Create alert
      </button>
      <a href={opportunity.officialUrl} target="_blank" rel="noreferrer" className="qy-btn qy-btn-secondary">
        Protocol
        <ExternalLink size={14} />
      </a>
      <button type="button" className="qy-btn qy-btn-secondary" onClick={copyLink}>
        <Copy size={14} />
        {copied ? 'Copied' : 'Share'}
      </button>
    </div>
  )
}
