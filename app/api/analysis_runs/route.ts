import { authMiddleware, scopedRepo } from 'lyzr-architect-pg'
import { analysis_runs, analyses } from '@/lib/db/schema'
import { asc, eq } from 'lyzr-architect-pg/schema'
import { NextResponse } from 'next/server'

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Unexpected database error.' }

export const GET = authMiddleware(async (request: any) => {
  try {
    const analysisId = new URL(request.url).searchParams.get('analysis_id')
    if (!analysisId) return NextResponse.json({ success: false, error: 'analysis_id is required.' }, { status: 400 })
    const analysis = await scopedRepo(analyses).findOne(eq(analyses.id, analysisId))
    if (!analysis) return NextResponse.json({ success: false, error: 'Analysis not found.' }, { status: 404 })
    const rows = await scopedRepo(analysis_runs).findMany({ where: eq(analysis_runs.analysis_id, analysisId), orderBy: asc(analysis_runs.created_at) })
    return NextResponse.json({ success: true, data: rows })
  } catch (error) { console.error('[API] GET /api/analysis_runs error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})

export const POST = authMiddleware(async (request: any) => {
  try {
    const body = await request.json() as Record<string, unknown>
    const analysisId = typeof body.analysis_id === 'string' ? body.analysis_id : ''
    if (!analysisId) return NextResponse.json({ success: false, error: 'analysis_id is required.' }, { status: 400 })
    const analysis = await scopedRepo(analyses).findOne(eq(analyses.id, analysisId))
    if (!analysis) return NextResponse.json({ success: false, error: 'Analysis not found.' }, { status: 404 })
    const status = typeof body.status === 'string' ? body.status : 'pending'
    const [row] = await scopedRepo(analysis_runs).insert(({ analysis_id: analysisId, run_type: typeof body.run_type === 'string' ? body.run_type : 'full', status, requested_sections: body.requested_sections ?? null, error_summary: typeof body.error_summary === 'string' ? body.error_summary : null, started_at: new Date(), completed_at: status === 'completed' ? new Date() : null } as any))
    return NextResponse.json({ success: true, data: row }, { status: 201 })
  } catch (error) { console.error('[API] POST /api/analysis_runs error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})
