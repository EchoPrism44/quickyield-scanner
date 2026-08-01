'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bell, X } from 'lucide-react'
import { categories, chains } from '../lib/constants'
import type { AlertCondition, Opportunity } from '../lib/types'

export type AlertDraft = {
  name: string
  chain: string
  category: string
  asset: string
  minApy: number
  maxRisk: 'Low' | 'Medium'
  minConfidence: number
  frequency: 'instant' | 'daily' | 'weekly'
  condition: AlertCondition
}

const conditionOptions: { key: AlertCondition; label: string }[] = [
  { key: 'apy-above', label: 'APY rises above' },
  { key: 'apy-below', label: 'APY drops below' },
  { key: 'apy-drop', label: 'APY drops fast' },
  { key: 'tvl-drop', label: 'TVL drains' },
  { key: 'reward-spike', label: 'Reward-reliant' },
]

/** Per-condition copy for the threshold input and its helper text. */
function thresholdMeta(condition: AlertCondition): { label: string; help: string } {
  switch (condition) {
    case 'apy-below':
      return { label: 'APY threshold (%)', help: 'Notify when a matching pool falls to or below this APY (downside watch).' }
    case 'apy-drop':
      return { label: 'Drop in 24h (pts)', help: 'Notify when APY falls by at least this many points in a day — a sudden yield collapse.' }
    case 'tvl-drop':
      return { label: 'TVL drop (%)', help: 'Notify when the pool loses at least this share of TVL since the last scan — a liquidity exit.' }
    case 'reward-spike':
      return { label: 'Reward share (%)', help: 'Notify when incentive tokens make up at least this share of APY — often an unsustainable trap.' }
    case 'apy-above':
    default:
      return { label: 'APY threshold (%)', help: 'Notify when a matching pool is at or above this APY.' }
  }
}

export function alertDraftFromOpportunity(item?: Opportunity, fallback?: { chain?: string; category?: string }): AlertDraft {
  return {
    name: item ? `${item.asset} APY > ${Math.max(1, Math.floor(item.apy))}%` : 'New yield target',
    chain: item?.chain ?? fallback?.chain ?? 'All chains',
    category: item?.category ?? fallback?.category ?? 'All categories',
    asset: item?.asset ?? '',
    minApy: item ? Math.max(1, Math.floor(item.apy)) : 5,
    maxRisk: item?.risk ?? 'Low',
    minConfidence: item ? Math.max(70, item.confidence - 5) : 75,
    frequency: 'daily',
    condition: 'apy-above',
  }
}

function describeAlert(draft: AlertDraft): string {
  const subject = draft.asset.trim() ? draft.asset.trim().toUpperCase() : 'any pool'
  const where = draft.chain && draft.chain !== 'All chains' ? `on ${draft.chain}` : 'on any chain'
  const risk = draft.maxRisk === 'Low' ? 'lower-risk only' : 'low or medium risk'
  const gates = `, ${risk}, safety ≥ ${draft.minConfidence}`

  switch (draft.condition) {
    case 'apy-below':
      return `Alert me when ${subject} APY drops to or below ${draft.minApy}% ${where}${gates}.`
    case 'apy-drop':
      return `Alert me when ${subject} APY falls ${draft.minApy}+ points in 24h ${where}.`
    case 'tvl-drop':
      return `Alert me when ${subject} loses ${draft.minApy}%+ of its TVL since the last scan ${where}.`
    case 'reward-spike':
      return `Alert me when ${subject} relies on reward tokens for ${draft.minApy}%+ of its APY ${where}.`
    case 'apy-above':
    default:
      return `Alert me when ${subject} APY rises to or above ${draft.minApy}% ${where}${gates}.`
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
  const dialogRef = useRef<HTMLFormElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const chainOptions = ['All chains', ...chains.filter((item) => item !== 'All chains')]
  const categoryOptions = ['All categories', ...categories.filter((item) => item !== 'All categories')]

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const firstField = dialog?.querySelector<HTMLElement>('input, select, button, [href], [tabindex]:not([tabindex="-1"])')
    firstField?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'))
        .filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [onClose])

  function patch(next: Partial<AlertDraft>) {
    onChange({ ...draft, ...next })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        ...draft,
        name: draft.name.trim() || `${draft.asset || 'Yield'} APY ${draft.condition === 'apy-below' ? '<' : '>'} ${draft.minApy}%`,
        asset: draft.asset.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="qy-modal-overlay" role="presentation">
      <form
        ref={dialogRef}
        className="qy-modal qy-alert-dialog"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qy-alert-dialog-title"
      >
        <div className="qy-modal-header">
          <div>
            <span className="qy-overline qy-overline-signal">Alert target</span>
            <h2 id="qy-alert-dialog-title">Set yield alert</h2>
          </div>
          <button type="button" className="qy-icon-btn" onClick={onClose} aria-label="Close alert target">
            <X size={16} />
          </button>
        </div>
        <div className="qy-modal-body qy-alert-dialog-body">
          <p className="qy-alert-preview" aria-live="polite">{describeAlert(draft)}</p>

          <fieldset className="qy-alert-frequency">
            <legend>Trigger when…</legend>
            {conditionOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`qy-chip ${draft.condition === item.key ? 'active-signal' : ''}`}
                onClick={() => patch({ condition: item.key })}
                aria-pressed={draft.condition === item.key}
              >
                {item.label}
              </button>
            ))}
          </fieldset>

          <label>
            <span>Name</span>
            <input className="qy-input" value={draft.name} maxLength={80} onChange={(event) => patch({ name: event.target.value })} />
            <small>Use a name you will recognize when the alert arrives.</small>
          </label>
          <div className="qy-alert-grid">
            <label>
              <span>Asset</span>
              <input className="qy-input" value={draft.asset} maxLength={16} placeholder="USDC, ETH..." onChange={(event) => patch({ asset: event.target.value.toUpperCase() })} />
            </label>
            <label>
              <span>{thresholdMeta(draft.condition).label}</span>
              <input className="qy-input" type="number" min={0} max={100} step={0.1} value={draft.minApy} onChange={(event) => patch({ minApy: Number(event.target.value) })} />
              <small>{thresholdMeta(draft.condition).help}</small>
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
              <span>Minimum safety score</span>
              <input className="qy-input" type="number" min={0} max={100} value={draft.minConfidence} onChange={(event) => patch({ minConfidence: Number(event.target.value) })} />
              <small>Higher scores mean the pool passed more of Litmus's market-data checks.</small>
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
                aria-pressed={draft.frequency === item}
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
