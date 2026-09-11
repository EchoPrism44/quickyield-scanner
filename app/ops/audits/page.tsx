'use client'

import { useEffect, useState } from 'react'

type Audit = { snapshotCount: number; latestDate: string | null; declaredPools: number; actualPools: number; duplicateIds: number; scoreGradeMismatches: number; status: 'healthy' | 'needs_review' }

export default function OperationsAuditsPage() {
  const [audit, setAudit] = useState<Audit | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  async function run() { setLoading(true); const response = await fetch('/api/ops/audits'); const data = await response.json(); if (!response.ok) setError(data.error || 'Audit failed'); else setAudit(data); setLoading(false) }
  useEffect(() => { void fetch('/api/ops/audits').then(async (response) => { const data = await response.json(); if (!response.ok) setError(data.error || 'Audit failed'); else setAudit(data); setLoading(false) }).catch(() => { setError('Audit failed'); setLoading(false) }) }, [])
  return <main className="qy-analytics"><div className="qy-container"><div className="qy-analytics-head"><div><span className="qy-overline qy-overline-signal">Internal audit</span><h1 className="qy-h2">Grade evidence checks</h1><p className="qy-analytics-sub">Fast integrity checks for the committed snapshot record. Predictive backtests remain available as local research commands.</p></div><button type="button" className="ql-btn ql-btn--ghost" onClick={() => void run()} disabled={loading}>{loading ? 'Running...' : 'Run checks'}</button></div>{error ? <p role="alert">{error}</p> : audit ? <div className="ql-ops-audit-grid"><div className={`ql-ops-audit-status ql-ops-audit-status--${audit.status}`}><strong>{audit.status === 'healthy' ? 'Snapshot record healthy' : 'Review required'}</strong><span>Latest snapshot: {audit.latestDate ?? 'none'}</span></div><div className="ql-ops-audit-card"><span>Snapshots</span><strong>{audit.snapshotCount}</strong></div><div className="ql-ops-audit-card"><span>Declared pools</span><strong>{audit.declaredPools.toLocaleString()}</strong></div><div className="ql-ops-audit-card"><span>Actual pools</span><strong>{audit.actualPools.toLocaleString()}</strong></div><div className="ql-ops-audit-card"><span>Duplicate pool IDs</span><strong>{audit.duplicateIds}</strong></div><div className="ql-ops-audit-card"><span>Grade mismatches</span><strong>{audit.scoreGradeMismatches}</strong></div><div className="ql-ops-audit-note"><strong>Predictive validation</strong><p>Run <code>npm run backtest:risk</code>, <code>npm run backtest:components</code>, and <code>npm run lift-test</code> before making claims about future loss prediction. The current evidence supports a transparent screen, not a guarantee.</p></div></div> : null}</div></main>
}
