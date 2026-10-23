'use client'

import { useState } from 'react'

const initial = { protocol: '', pool: '', chain: '', poolId: '', llamaUrl: '', tvlUsd: '', requesterName: '', workEmail: '', role: '', tier: 'one_pool', timing: '', notes: '', website: '' }

export function AssessmentRequestForm() {
  const [form, setForm] = useState(initial)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const update = (key: keyof typeof initial, value: string) => setForm((current) => ({ ...current, [key]: value }))
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    const response = await fetch('/api/assessment-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) { setState('error'); setMessage(result.error ?? 'Please check the form and try again.'); return }
    setState('sent'); setMessage('Request received. We will review the pool and reply with scope, timing, and next steps.'); setForm(initial)
  }
  if (state === 'sent') return <div className="ql-contact-card"><h3>Request received</h3><p>{message}</p></div>
  return (
    <form className="ql-contact-card ql-assessment-form" onSubmit={submit}>
      <p>Start with the pool you want assessed. We will confirm eligibility and scope before any payment is requested.</p>
      <div className="ql-form-grid">
        <label>Protocol<input required value={form.protocol} onChange={(e) => update('protocol', e.target.value)} placeholder="Protocol name" /></label>
        <label>Pool<input required value={form.pool} onChange={(e) => update('pool', e.target.value)} placeholder="Pool or vault name" /></label>
        <label>Chain<input required value={form.chain} onChange={(e) => update('chain', e.target.value)} placeholder="Ethereum, Base, Solana" /></label>
        <label>DeFiLlama pool ID<input value={form.poolId} onChange={(e) => update('poolId', e.target.value)} placeholder="Optional" /></label>
        <label>Your name<input required value={form.requesterName} onChange={(e) => update('requesterName', e.target.value)} /></label>
        <label>Work email<input required type="email" value={form.workEmail} onChange={(e) => update('workEmail', e.target.value)} /></label>
        <label>Role<input value={form.role} onChange={(e) => update('role', e.target.value)} placeholder="Founder, growth, risk" /></label>
        <label>Assessment tier<select value={form.tier} onChange={(e) => update('tier', e.target.value)}><option value="one_pool">One pool, $500</option><option value="three_pools">Up to three pools, $1,200</option></select></label>
        <label>Pool TVL in USD<input type="number" min="0" value={form.tvlUsd} onChange={(e) => update('tvlUsd', e.target.value)} placeholder="Optional" /></label>
        <label>Target timing<input value={form.timing} onChange={(e) => update('timing', e.target.value)} placeholder="This month, flexible" /></label>
      </div>
      <label>DeFiLlama URL<input type="url" value={form.llamaUrl} onChange={(e) => update('llamaUrl', e.target.value)} placeholder="https://defillama.com/yields/pool/..." /></label>
      <label>Notes<textarea rows={4} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="What should the assessment help your team communicate?" /></label>
      <input className="ql-honeypot" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} aria-hidden="true" />
      <div className="ql-form-actions"><button className="ql-btn ql-btn--primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending...' : 'Request qualification'}</button>{state === 'error' ? <span role="alert">{message}</span> : null}</div>
    </form>
  )
}
