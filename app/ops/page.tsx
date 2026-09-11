import Link from 'next/link'
import { isAssessmentAdmin } from '../../lib/auth'

export default async function OperationsHome() {
  const allowed = await isAssessmentAdmin()
  return <main className="qy-analytics"><div className="qy-container"><div className="qy-analytics-head"><div><span className="qy-overline qy-overline-signal">Litmus operations</span><h1 className="qy-h2">Internal workspace</h1><p className="qy-analytics-sub">Run the assessment business and review grade evidence without touching the repository.</p></div></div>{allowed ? <div className="ql-ops-hub"><Link href="/ops/assessments" className="ql-ops-hub-card"><strong>Assessment queue</strong><span>Qualify leads, prepare reports, and track factual review.</span></Link><Link href="/ops/audits" className="ql-ops-hub-card"><strong>Grade audits</strong><span>Check snapshot integrity, grade distributions, and data freshness.</span></Link><Link href="/ops/methodology" className="ql-ops-hub-card"><strong>Methodology</strong><span>Review the live weights, thresholds, and public language.</span></Link><div className="ql-ops-hub-card ql-ops-hub-card--muted"><strong>Field Notes</strong><span>Editorial publishing remains code-reviewed for now. A CMS editor is the next content workflow.</span></div></div> : <p role="alert">Owner access required. Sign in with an email listed in ASSESSMENT_ADMIN_EMAILS.</p>}</div></main>
}
