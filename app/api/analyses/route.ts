import { authMiddleware, scopedRepo } from 'lyzr-architect-pg'
import { analysis_items, analysis_runs, analysis_sources, analyses, traceability_links } from '@/lib/db/schema'
import { desc, eq } from 'lyzr-architect-pg/schema'
import { NextResponse } from 'next/server'

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected database error.'
}

export const GET = authMiddleware(async (request: any) => {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const query = url.searchParams.get('q')?.trim()
    const rows = await scopedRepo(analyses).findMany({ orderBy: desc(analyses.updated_at) })
    const filtered = rows.filter((row) => (!status || row.status === status) && (!query || row.title.toLowerCase().includes(query.toLowerCase()) || (row.description ?? '').toLowerCase().includes(query.toLowerCase())))
    return NextResponse.json({ success: true, data: filtered })
  } catch (error) {
    console.error('[API] GET /api/analyses error:', error)
    return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 })
  }
})

export const POST = authMiddleware(async (request: any) => {
  try {
    const body = await request.json() as Record<string, unknown>
    if (body.action === 'duplicate' && typeof body.id === 'string') {
      const source = await scopedRepo(analyses).findOne(eq(analyses.id, body.id))
      if (!source) return NextResponse.json({ success: false, error: 'Analysis not found.' }, { status: 404 })
      const [copy] = await scopedRepo(analyses).insert(({ title: `${source.title} copy`, description: source.description, industry: source.industry, audience: source.audience, status: 'draft', source_text: source.source_text, analysis_version: source.analysis_version } as any))
      if (!copy) return NextResponse.json({ success: false, error: 'Duplicate could not be created.' }, { status: 500 })
      const sourceRows = await scopedRepo(analysis_sources).findMany({ where: eq(analysis_sources.analysis_id, source.id) })
      if (sourceRows.length) await scopedRepo(analysis_sources).insert(sourceRows.map((row) => ({ analysis_id: copy.id, source_type: row.source_type, display_name: row.display_name, asset_id: row.asset_id, mime_type: row.mime_type, file_size: row.file_size, upload_status: row.upload_status } as any)))
      const itemRows = await scopedRepo(analysis_items).findMany({ where: eq(analysis_items.analysis_id, source.id) })
      const copiedItems = itemRows.length ? await scopedRepo(analysis_items).insert(itemRows.map((row) => ({ analysis_id: copy.id, item_key: row.item_key, category: row.category, title: row.title, statement: row.statement, rationale: row.rationale, evidence_type: row.evidence_type, priority: row.priority, priority_rationale: row.priority_rationale, confidence: row.confidence, is_user_edited: row.is_user_edited, sort_order: row.sort_order } as any))) : []
      const itemIdMap = new Map(itemRows.map((row, index) => [row.id, copiedItems[index]?.id]))
      const linkRows = await scopedRepo(traceability_links).findMany({ where: eq(traceability_links.analysis_id, source.id) })
      const copiedLinks = linkRows.flatMap((row) => { const from = itemIdMap.get(row.from_item_id); const to = itemIdMap.get(row.to_item_id); return from && to ? [{ analysis_id: copy.id, from_item_id: from, to_item_id: to, link_type: row.link_type, evidence_note: row.evidence_note, is_inferred: row.is_inferred } as any] : [] })
      if (copiedLinks.length) await scopedRepo(traceability_links).insert(copiedLinks)
      const runRows = await scopedRepo(analysis_runs).findMany({ where: eq(analysis_runs.analysis_id, source.id) })
      if (runRows.length) await scopedRepo(analysis_runs).insert(runRows.map((row) => ({ analysis_id: copy.id, run_type: row.run_type, status: row.status, requested_sections: row.requested_sections, error_summary: row.error_summary, started_at: row.started_at, completed_at: row.completed_at } as any)))
      return NextResponse.json({ success: true, data: copy }, { status: 201 })
    }
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) return NextResponse.json({ success: false, error: 'A project title is required.' }, { status: 400 })
    const [row] = await scopedRepo(analyses).insert(({ title, description: typeof body.description === 'string' ? body.description : null, industry: typeof body.industry === 'string' ? body.industry : null, audience: typeof body.audience === 'string' ? body.audience : null, status: 'draft', source_text: typeof body.source_text === 'string' ? body.source_text : null, analysis_version: 1 } as any))
    return NextResponse.json({ success: true, data: row }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/analyses error:', error)
    return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 })
  }
})

export const PATCH = authMiddleware(async (request: any) => {
  try {
    const body = await request.json() as Record<string, unknown>
    const id = typeof body.id === 'string' ? body.id : ''
    if (!id) return NextResponse.json({ success: false, error: 'Analysis id is required.' }, { status: 400 })
    const current = await scopedRepo(analyses).findOne(eq(analyses.id, id))
    if (!current) return NextResponse.json({ success: false, error: 'Analysis not found.' }, { status: 404 })
    const updates: Record<string, unknown> = {}
    for (const field of ['title', 'description', 'industry', 'audience', 'status', 'source_text']) if (typeof body[field] === 'string' || body[field] === null) updates[field] = body[field]
    if (typeof body.analysis_version === 'number') updates.analysis_version = body.analysis_version
    if (body.status === 'ready') updates.last_analyzed_at = new Date()
    const [row] = await scopedRepo(analyses).update(eq(analyses.id, id), updates)
    return NextResponse.json({ success: true, data: row })
  } catch (error) {
    console.error('[API] PATCH /api/analyses error:', error)
    return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 })
  }
})

export const DELETE = authMiddleware(async (request: any) => {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'Analysis id is required.' }, { status: 400 })
    const deleted = await scopedRepo(analyses).delete(eq(analyses.id, id))
    return NextResponse.json({ success: true, data: deleted })
  } catch (error) {
    console.error('[API] DELETE /api/analyses error:', error)
    return NextResponse.json({ success: false, error: messageOf(error) }, { status: 400 })
  }
})
