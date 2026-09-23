import { authMiddleware, scopedRepo } from 'lyzr-architect-pg'
import { analysis_items, analyses, traceability_links } from '@/lib/db/schema'
import { asc, eq } from 'lyzr-architect-pg/schema'
import { NextResponse } from 'next/server'

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Unexpected database error.' }

export const GET = authMiddleware(async (request: any) => {
  try {
    const analysisId = new URL(request.url).searchParams.get('analysis_id')
    if (!analysisId) return NextResponse.json({ success: false, error: 'analysis_id is required.' }, { status: 400 })
    const analysis = await scopedRepo(analyses).findOne(eq(analyses.id, analysisId))
    if (!analysis) return NextResponse.json({ success: false, error: 'Analysis not found.' }, { status: 404 })
    const rows = await scopedRepo(traceability_links).findMany({ where: eq(traceability_links.analysis_id, analysisId), orderBy: asc(traceability_links.created_at) })
    return NextResponse.json({ success: true, data: rows })
  } catch (error) { console.error('[API] GET /api/traceability_links error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})

export const POST = authMiddleware(async (request: any) => {
  try {
    const body = await request.json() as Record<string, unknown>
    const analysisId = typeof body.analysis_id === 'string' ? body.analysis_id : ''
    if (!analysisId) return NextResponse.json({ success: false, error: 'analysis_id is required.' }, { status: 400 })
    const analysis = await scopedRepo(analyses).findOne(eq(analyses.id, analysisId))
    if (!analysis) return NextResponse.json({ success: false, error: 'Analysis not found.' }, { status: 404 })
    const itemRows = await scopedRepo(analysis_items).findMany({ where: eq(analysis_items.analysis_id, analysisId) })
    const byId = new Map(itemRows.map((item) => [item.id, item]))
    const byKey = new Map(itemRows.map((item) => [item.item_key, item]))
    const rawLinks = Array.isArray(body.links) ? body.links : [body]
    const values = rawLinks.flatMap((raw) => {
      if (!raw || typeof raw !== 'object') return []
      const value = raw as Record<string, unknown>
      const fromValue = typeof value.from_item_id === 'string' ? value.from_item_id : ''
      const toValue = typeof value.to_item_id === 'string' ? value.to_item_id : ''
      const from = byId.get(fromValue) ?? byKey.get(fromValue)
      const to = byId.get(toValue) ?? byKey.get(toValue)
      if (!from || !to || from.id === to.id) return []
      return [{ analysis_id: analysisId, from_item_id: from.id, to_item_id: to.id, link_type: typeof value.link_type === 'string' ? value.link_type : 'relates_to', evidence_note: typeof value.evidence_note === 'string' ? value.evidence_note : null, is_inferred: value.is_inferred === true }]
    })
    if (values.length === 0) return NextResponse.json({ success: false, error: 'No valid traceability links were provided.' }, { status: 400 })
    const rows = await scopedRepo(traceability_links).insert(values)
    return NextResponse.json({ success: true, data: rows }, { status: 201 })
  } catch (error) { console.error('[API] POST /api/traceability_links error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})

export const DELETE = authMiddleware(async (request: any) => {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'link id is required.' }, { status: 400 })
    await scopedRepo(traceability_links).delete(eq(traceability_links.id, id))
    return NextResponse.json({ success: true })
  } catch (error) { console.error('[API] DELETE /api/traceability_links error:', error); return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 }) }
})
