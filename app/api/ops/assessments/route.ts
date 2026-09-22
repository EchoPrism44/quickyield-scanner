import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAssessmentAdmin } from '../../../../lib/auth'
import { createAssessment, getAssessmentLeads, updateAssessmentLeadStatus } from '../../../../lib/store'
import type { AssessmentLeadStatus, PublishedAssessment } from '../../../../lib/types'

const statusSchema = z.object({ leadId: z.string().min(1), status: z.enum(['submitted', 'qualified', 'scoped', 'invoiced', 'paid', 'in_review', 'factual_review', 'published', 'declined']) })
const reportSchema = z.object({ leadId: z.string(), slug: z.string().regex(/^[a-z0-9-]+$/), protocol: z.string(), pool: z.string(), chain: z.string(), assessedAt: z.string(), methodologyVersion: z.string(), grade: z.object({ letter: z.enum(['A', 'B', 'C', 'D', 'F']), score: z.number().int().min(0).max(100), label: z.string(), summary: z.string(), weakest: z.string() }), signals: z.object({ liquidity: z.number().min(0).max(100), stability: z.number().min(0).max(100), sustainability: z.number().min(0).max(100), completeness: z.number().min(0).max(100) }), strengths: z.array(z.string()), watchpoints: z.array(z.string()), summary: z.string() })

async function guard() { return isAssessmentAdmin() }
export async function GET() { if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); return NextResponse.json({ leads: await getAssessmentLeads() }) }
export async function PATCH(request: NextRequest) { if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); const parsed = statusSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: 'Invalid status update' }, { status: 400 }); return NextResponse.json({ lead: await updateAssessmentLeadStatus(parsed.data.leadId, parsed.data.status as AssessmentLeadStatus) }) }
export async function POST(request: NextRequest) { if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); const parsed = reportSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: 'Invalid report payload' }, { status: 400 }); const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); const report = await createAssessment({ ...parsed.data, status: 'factual_review', factualReviewDeadline: deadline } as Omit<PublishedAssessment, 'id'>); await updateAssessmentLeadStatus(parsed.data.leadId, 'factual_review'); return NextResponse.json({ report, factualReviewDeadline: deadline }, { status: 201 }) }
