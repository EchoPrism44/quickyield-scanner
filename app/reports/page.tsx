import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'
import { getPublishedAssessments } from '../../lib/store'

export const metadata: Metadata = { title: 'Published Yield Pool Assessments | Litmus', description: 'Public Litmus Yield Pool Assessments, published from a fixed methodology after factual review.', alternates: { canonical: '/reports' } }

export default async function ReportsPage() {
  const reports = await getPublishedAssessments()
  return <main className="ql"><div className="ql-grain" aria-hidden="true" /><MarketingNav /><div className="ql-docs-hero"><span className="ql-eyebrow">Public reports</span><h1 className="ql-h2">Yield Pool Assessments</h1><p className="ql-lead">Completed assessments are published here after a seven-day factual-correction window. Payment buys research time and report depth, never a grade.</p></div><section className="ql-section ql-section--tight"><div className="ql-wrap"><div className="ql-report-list">{reports.map((report) => <Link className="ql-report-item" href={`/assessments/${report.slug}`} key={report.id}><div><span className="ql-eyebrow">{report.chain} · {report.assessedAt}</span><h2>{report.protocol} · {report.pool}</h2><p>{report.summary}</p></div><span className={`ql-grade-letter ql-grade-${report.grade.letter.toLowerCase()}`}>{report.grade.letter}</span></Link>)}</div>{reports.length === 0 ? <p className="ql-lead">No public reports have been published yet.</p> : null}</div></section><MarketingFooter /></main>
}
