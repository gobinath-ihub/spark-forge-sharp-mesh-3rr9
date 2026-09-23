import { authMiddleware, scopedRepo } from 'lyzr-architect-pg'
import { analysis_items, analyses } from '@/lib/db/schema'
import { asc, eq } from 'lyzr-architect-pg/schema'
import { NextResponse } from 'next/server'

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Unexpected database error.' }

export const GET = authMiddleware(async (request: any) => {
  try {
    const analysisId = new URL(request.url).searchParams.get('analysis_id')
    if (!analysisId) return NextResponse.json({ success: false, error: 'analysis_id is required.' }, { status: 400 })
    const analysis = await scopedRepo(analyses).findOne(eq(analyses.id, analysisId))
    if (!analysis) return NextResponse.json({ success: false, error: 'Analysis not found.' }, { status: 404 })
    const rows = await scopedRepo(analysis_items).findMany({ where: eq(analysis_items.analysis_id, analysisId), orderBy: asc(analysis_items.sort_order) })
    return NextResponse.json({ success: true, data: rows })
  } catch (error) { console.error('[API] GET /api/analysis_items error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})

export const POST = authMiddleware(async (request: any) => {
  try {
    const body = await request.json() as Record<string, unknown>
    const analysisId = typeof body.analysis_id === 'string' ? body.analysis_id : ''
    if (!analysisId) return NextResponse.json({ success: false, error: 'analysis_id is required.' }, { status: 400 })
    const analysis = await scopedRepo(analyses).findOne(eq(analyses.id, analysisId))
    if (!analysis) return NextResponse.json({ success: false, error: 'Analysis not found.' }, { status: 404 })
    if (body.replace_existing === true) await scopedRepo(analysis_items).delete(eq(analysis_items.analysis_id, analysisId))
    const rawItems = Array.isArray(body.items) ? body.items : [body]
    const values = rawItems.flatMap((raw, index) => {
      if (!raw || typeof raw !== 'object') return []
      const value = raw as Record<string, unknown>
      if (typeof value.item_key !== 'string' || typeof value.title !== 'string' || typeof value.statement !== 'string') return []
      return [{ analysis_id: analysisId, item_key: value.item_key, category: typeof value.category === 'string' ? value.category : null, title: value.title, statement: value.statement, rationale: typeof value.rationale === 'string' ? value.rationale : null, evidence_type: typeof value.evidence_type === 'string' ? value.evidence_type : null, priority: typeof value.priority === 'string' ? value.priority : null, priority_rationale: typeof value.priority_rationale === 'string' ? value.priority_rationale : null, confidence: typeof value.confidence === 'number' ? String(value.confidence) : null, is_user_edited: value.is_user_edited === true, sort_order: typeof value.sort_order === 'number' ? value.sort_order : index }]
    })
    if (values.length === 0) return NextResponse.json({ success: false, error: 'At least one valid item is required.' }, { status: 400 })
    const rows = await scopedRepo(analysis_items).insert(values)
    return NextResponse.json({ success: true, data: rows }, { status: 201 })
  } catch (error) { console.error('[API] POST /api/analysis_items error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})

export const PATCH = authMiddleware(async (request: any) => {
  try {
    const body = await request.json() as Record<string, unknown>
    const id = typeof body.id === 'string' ? body.id : ''
    if (!id) return NextResponse.json({ success: false, error: 'item id is required.' }, { status: 400 })
    const updates: Record<string, unknown> = { is_user_edited: true }
    for (const field of ['title', 'statement', 'rationale', 'priority', 'priority_rationale']) if (typeof body[field] === 'string') updates[field] = body[field]
    const [row] = await scopedRepo(analysis_items).update(eq(analysis_items.id, id), updates)
    if (!row) return NextResponse.json({ success: false, error: 'Item not found.' }, { status: 404 })
    return NextResponse.json({ success: true, data: row })
  } catch (error) { console.error('[API] PATCH /api/analysis_items error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})

export const DELETE = authMiddleware(async (request: any) => {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'item id is required.' }, { status: 400 })
    await scopedRepo(analysis_items).delete(eq(analysis_items.id, id))
    return NextResponse.json({ success: true })
  } catch (error) { console.error('[API] DELETE /api/analysis_items error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})
