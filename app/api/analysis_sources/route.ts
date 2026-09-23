import { authMiddleware, scopedRepo } from 'lyzr-architect-pg'
import { analysis_sources, analyses } from '@/lib/db/schema'
import { asc, eq } from 'lyzr-architect-pg/schema'
import { NextResponse } from 'next/server'

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Unexpected database error.' }

export const GET = authMiddleware(async (request: any) => {
  try {
    const analysisId = new URL(request.url).searchParams.get('analysis_id')
    if (!analysisId) return NextResponse.json({ success: false, error: 'analysis_id is required.' }, { status: 400 })
    const analysis = await scopedRepo(analyses).findOne(eq(analyses.id, analysisId))
    if (!analysis) return NextResponse.json({ success: false, error: 'Analysis not found.' }, { status: 404 })
    const rows = await scopedRepo(analysis_sources).findMany({ where: eq(analysis_sources.analysis_id, analysisId), orderBy: asc(analysis_sources.created_at) })
    return NextResponse.json({ success: true, data: rows })
  } catch (error) { console.error('[API] GET /api/analysis_sources error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})

export const POST = authMiddleware(async (request: any) => {
  try {
    const body = await request.json() as Record<string, unknown>
    const analysisId = typeof body.analysis_id === 'string' ? body.analysis_id : ''
    const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : ''
    if (!analysisId || !displayName) return NextResponse.json({ success: false, error: 'analysis_id and display_name are required.' }, { status: 400 })
    const analysis = await scopedRepo(analyses).findOne(eq(analyses.id, analysisId))
    if (!analysis) return NextResponse.json({ success: false, error: 'Analysis not found.' }, { status: 404 })
    const [row] = await scopedRepo(analysis_sources).insert(({ analysis_id: analysisId, source_type: typeof body.source_type === 'string' ? body.source_type : 'uploaded_document', display_name: displayName, asset_id: typeof body.asset_id === 'string' ? body.asset_id : null, mime_type: typeof body.mime_type === 'string' ? body.mime_type : null, file_size: typeof body.file_size === 'number' ? body.file_size : null, upload_status: typeof body.upload_status === 'string' ? body.upload_status : 'pending' } as any))
    return NextResponse.json({ success: true, data: row }, { status: 201 })
  } catch (error) { console.error('[API] POST /api/analysis_sources error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})

export const DELETE = authMiddleware(async (request: any) => {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'source id is required.' }, { status: 400 })
    await scopedRepo(analysis_sources).delete(eq(analysis_sources.id, id))
    return NextResponse.json({ success: true })
  } catch (error) { console.error('[API] DELETE /api/analysis_sources error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})
