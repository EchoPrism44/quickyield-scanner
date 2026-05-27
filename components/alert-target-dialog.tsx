'use client'

import { useState, type FormEvent } from 'react'
import { Bell, X } from 'lucide-react'
import { categories, chains } from '../lib/constants'
import type { Opportunity } from '../lib/types'

export type AlertDraft = {
  name: string
  chain: string
  category: string
  asset: string
  minApy: number
  maxRisk: 'Low' | 'Medium'
  minConfidence: number
  frequency: 'instant' | 'daily' | 'weekly'
}

export function alertDraftFromOpportunity(item?: Opportunity, fallback?: { chain?: string; category?: string }): AlertDraft {
  return {
    name: item ? `${item.asset} above ${Math.max(1, Math.floor(item.apy))}%` : 'New yield target',
    chain: item?.chain ?? fallback?.chain ?? 'All chains',
    category: item?.category ?? fallback?.category ?? 'All categories',
    asset: item?.asset ?? '',
    minApy: item ? Math.max(1, Math.floor(item.apy)) : 5,
    maxRisk: item?.risk ?? 'Low',
    minConfidence: item ? Math.max(70, item.confidence - 5) : 75,
    frequency: 'daily',
  }
}

export function AlertTargetDialog({
  draft,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: AlertDraft
  onChange: (draft: AlertDraft) => void
  onClose: () => void
  onSubmit: (draft: AlertDraft) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const chainOptions = ['All chains', ...chains.filter((item) => item !== 'All chains')]
  const categoryOptions = ['All categories', ...categories.filter((item) => item !== 'All categories')]

  function patch(next: Partial<AlertDraft>) {
    onChange({ ...draft, ...next })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        ...draft,
        name: draft.name.trim() || `${draft.asset || 'Yield'} above ${draft.minApy}%`,
        asset: draft.asset.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="qy-modal-overlay" role="presentation">
      <form className="qy-modal qy-alert-dialog" onSubmit={submit} aria-label="Create alert target">
        <div className="qy-modal-header">
          <div>
            <span className="qy-overline qy-overline-signal">Alert target</span>
            <h2>Set yield alert</h2>
          </div>
          <button type="button" className="qy-icon-btn" onClick={onClose} aria-label="Close alert target">
            <X size={16} />
          </button>
        </div>
        <div className="qy-modal-body qy-alert-dialog-body">
          <label>
            <span>Name</span>
            <input className="qy-input" value={draft.name} maxLength={80} onChange={(event) => patch({ name: event.target.value })} />
          </label>
          <div className="qy-alert-grid">
            <label>
              <span>Asset</span>
              <input className="qy-input" value={draft.asset} maxLength={16} placeholder="USDC, ETH..." onChange={(event) => patch({ asset: event.target.value.toUpperCase() })} />
            </label>
            <label>
              <span>Minimum APY</span>
              <input className="qy-input" type="number" min={0} max={100} step={0.1} value={draft.minApy} onChange={(event) => patch({ minApy: Number(event.target.value) })} />
            </label>
            <label>
              <span>Chain</span>
              <select className="qy-input" value={draft.chain} onChange={(event) => patch({ chain: event.target.value })}>
                {chainOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>Category</span>
              <select className="qy-input" value={draft.category} onChange={(event) => patch({ category: event.target.value })}>
                {categoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>Max risk</span>
              <select className="qy-input" value={draft.maxRisk} onChange={(event) => patch({ maxRisk: event.target.value as AlertDraft['maxRisk'] })}>
                <option value="Low">Low only</option>
                <option value="Medium">Low or medium</option>
              </select>
            </label>
            <label>
              <span>Min confidence</span>
              <input className="qy-input" type="number" min={0} max={100} value={draft.minConfidence} onChange={(event) => patch({ minConfidence: Number(event.target.value) })} />
            </label>
          </div>
          <fieldset className="qy-alert-frequency">
            <legend>Frequency</legend>
            {(['instant', 'daily', 'weekly'] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`qy-chip ${draft.frequency === item ? 'active-signal' : ''}`}
                onClick={() => patch({ frequency: item })}
              >
                {item}
              </button>
            ))}
          </fieldset>
        </div>
        <div className="qy-modal-footer">
          <button type="button" className="qy-btn qy-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="qy-btn qy-btn-primary" disabled={saving}>
            <Bell size={14} />
            {saving ? 'Saving...' : 'Save alert'}
          </button>
        </div>
      </form>
    </div>
  )
}
