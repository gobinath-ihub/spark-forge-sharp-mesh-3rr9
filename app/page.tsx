'use client'

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthProvider, ProtectedRoute, UserMenu, useAuth } from 'lyzr-architect-pg/client'
import { Toaster, toast } from 'sonner'
import { AlertCircle, Check, Loader2, Moon, Sun } from 'lucide-react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import AuthScreen from '@/app/sections/AuthScreen'
import WorkspaceView from '@/app/sections/WorkspaceView'
import IntakeView from '@/app/sections/IntakeView'
import ReviewView from '@/app/sections/ReviewView'

const REQUIREMENTS_AGENT_ID = '6ab3ac842e757a598ee00209'

export type AnalysisStatus = 'draft' | 'analyzing' | 'ready' | 'archived'
export type EvidenceType = 'explicit' | 'inferred' | 'mixed' | 'unknown'
export type Confidence = 'high' | 'medium' | 'low' | 'unknown'
export type ReviewStatus = 'ai_generated' | 'needs_review' | 'accepted'
export type Priority = 'Must' | 'Should' | 'Could' | "Won't for now"

export interface AnalysisRow {
  id: string
  title: string
  description: string | null
  industry: string | null
  audience: string | null
  status: AnalysisStatus
  source_text: string | null
  analysis_version: number
  last_analyzed_at: string | null
  created_at?: string
  updated_at?: string
}

export interface SourceRow {
  id: string
  analysis_id: string
  source_type: string
  display_name: string
  asset_id: string | null
  mime_type: string | null
  file_size: number | null
  upload_status: string
  created_at?: string
}

export interface ItemRow {
  id: string
  analysis_id: string
  item_key: string
  category: string | null
  title: string
  statement: string
  rationale: string | null
  evidence_type: EvidenceType | null
  priority: Priority | null
  priority_rationale: string | null
  confidence: number | null
  is_user_edited: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface LinkRow {
  id: string
  analysis_id: string
  from_item_id: string
  to_item_id: string
  link_type: string
  evidence_note: string | null
  is_inferred: boolean
}

export interface RunRow {
  id: string
  analysis_id: string
  run_type: string
  status: string
  requested_sections: unknown
  error_summary: string | null
  started_at: string | null
  completed_at: string | null
  created_at?: string
}

export interface SourceReference {
  source_id: string
  evidence_label: 'direct' | 'paraphrased' | 'inferred' | 'conflicting' | 'missing'
  locator: string
  note: string
}

export interface EvidenceItem {
  item_id: string
  title: string
  statement: string
  rationale: string
  evidence_type: EvidenceType
  source_references: SourceReference[]
  confidence: Confidence
  review_status: ReviewStatus
  notes: string
}

export interface Stakeholder extends EvidenceItem {
  stakeholder_type: string
}

export interface ScopeItem extends EvidenceItem {}

export interface Requirement extends EvidenceItem {
  priority: Priority
  priority_rationale: string
  priority_basis: string[]
  priority_is_recommendation: boolean
  linked_objective_ids: string[]
  linked_user_need_ids: string[]
  linked_success_criteria_ids: string[]
  dependency_ids: string[]
  risk_ids: string[]
}

export interface Dependency extends EvidenceItem {
  depends_on_item_ids: string[]
  affected_item_ids: string[]
}

export interface Risk extends EvidenceItem {
  impact: Confidence
  likelihood: Confidence
  mitigation: string
  affected_item_ids: string[]
}

export interface Assumption extends EvidenceItem {
  validation_needed: boolean
  affected_item_ids: string[]
}

export interface OpenQuestion {
  item_id: string
  title: string
  question: string
  why_it_matters: string
  evidence_type: EvidenceType
  source_references: SourceReference[]
  urgency: Confidence
  confidence: Confidence
  review_status: ReviewStatus
  affected_item_ids: string[]
  suggested_owner: string
  notes: string
}

export interface ConflictClaim {
  claim_id: string
  source_id: string
  claim: string
  evidence_label: 'direct' | 'paraphrased' | 'inferred' | 'unknown'
}

export interface Conflict {
  item_id: string
  title: string
  description: string
  conflicting_claims: ConflictClaim[]
  source_references: SourceReference[]
  affected_item_ids: string[]
  severity: Confidence
  resolution_status: 'unresolved' | 'partially_resolved' | 'resolved_by_assumption' | 'resolved'
  recommended_resolution: string
  confidence: Confidence
  review_status: ReviewStatus
  notes: string
}

export interface SuccessCriterion extends EvidenceItem {
  metric: string
  target: string
  timeframe: string
  linked_objective_ids: string[]
  linked_requirement_ids: string[]
}

export interface TraceabilityLink {
  link_id: string
  from_item_id: string
  from_item_type: string
  to_item_id: string
  to_item_type: string
  link_type: 'supports' | 'derived_from' | 'satisfies' | 'measures' | 'depends_on' | 'constrains' | 'conflicts_with' | 'clarifies' | 'covers' | 'relates_to'
  evidence_label: 'direct' | 'inferred' | 'uncertain' | 'conflicting' | 'not_available'
  evidence_note: string
  is_inferred: boolean
  confidence: Confidence
  source_references: SourceReference[]
}

export interface CoverageGap {
  item_id: string
  gap_type: 'orphan_objective' | 'orphan_user_need' | 'unlinked_requirement' | 'uncovered_success_criterion' | 'missing_source' | 'missing_priority_rationale' | 'missing_section' | 'conflict' | 'open_question'
  description: string
  affected_item_ids: string[]
  severity: Confidence
  recommended_action: string
  source_references: SourceReference[]
}

export interface ReviewGuidance {
  guidance_id: string
  severity: 'high' | 'medium' | 'low'
  category: 'missing_evidence' | 'conflict' | 'ambiguity' | 'coverage_gap' | 'human_review'
  message: string
  affected_item_ids: string[]
  recommended_action: string
  source_references: SourceReference[]
}

export interface SourceInventoryItem {
  source_id: string
  label: string
  source_type: 'pasted_text' | 'uploaded_document' | 'project_context' | 'agent_inference' | 'unknown'
  display_name: string
  asset_id: string
  mime_type: string
  locator: string
  content_summary: string
  evidence_quality: Confidence
  is_user_provided: boolean
}

export interface AgentResult {
  analysis_title: string
  analysis_version: string
  executive_summary: string
  source_inventory: SourceInventoryItem[]
  business_objectives: EvidenceItem[]
  stakeholders: Stakeholder[]
  scope: { in_scope: ScopeItem[]; out_of_scope: ScopeItem[] }
  user_needs: EvidenceItem[]
  functional_requirements: Requirement[]
  non_functional_requirements: Requirement[]
  constraints: EvidenceItem[]
  dependencies: Dependency[]
  risks: Risk[]
  assumptions: Assumption[]
  open_questions: OpenQuestion[]
  conflicts_and_ambiguities: Conflict[]
  success_criteria: SuccessCriterion[]
  priority_summary: {
    must_count: number
    should_count: number
    could_count: number
    wont_for_now_count: number
    rationale: string
    human_review_required: boolean
    recommendation_notice: string
  }
  traceability: {
    links: TraceabilityLink[]
    orphan_objective_ids: string[]
    orphan_user_need_ids: string[]
    orphan_requirement_ids: string[]
    uncovered_success_criterion_ids: string[]
    coverage_gaps: CoverageGap[]
    matrix_notes: string
  }
  completeness: {
    required_sections: {
      executive_summary: boolean
      business_objectives: boolean
      stakeholders: boolean
      scope: boolean
      user_needs: boolean
      functional_requirements: boolean
      non_functional_requirements: boolean
      constraints: boolean
      dependencies: boolean
      risks: boolean
      assumptions: boolean
      open_questions: boolean
      conflicts_and_ambiguities: boolean
      success_criteria: boolean
      prioritization: boolean
      traceability: boolean
    }
    missing_sections: string[]
    overall_score: number
    unresolved_issue_count: number
    coverage_notes: string
  }
  review_guidance: ReviewGuidance[]
}

export interface IntakeDraft {
  title: string
  industry: string
  audience: string
  description: string
  sourceText: string
}

export interface FileState {
  file: File
  status: 'ready' | 'uploading' | 'uploaded' | 'failed'
  assetId?: string
  message?: string
}

export interface ItemPatch {
  title?: string
  statement?: string
  rationale?: string
  priority?: Priority
  priority_rationale?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isAgentResult(value: unknown): value is AgentResult {
  if (!isRecord(value)) return false
  const requiredStrings = ['analysis_title', 'analysis_version', 'executive_summary']
  if (!requiredStrings.every((key) => typeof value[key] === 'string')) return false
  const arrayKeys = [
    'source_inventory', 'business_objectives', 'stakeholders', 'user_needs', 'functional_requirements',
    'non_functional_requirements', 'constraints', 'dependencies', 'risks', 'assumptions', 'open_questions',
    'conflicts_and_ambiguities', 'success_criteria', 'review_guidance',
  ]
  if (!arrayKeys.every((key) => Array.isArray(value[key]))) return false
  if (!isRecord(value.scope) || !Array.isArray(value.scope.in_scope) || !Array.isArray(value.scope.out_of_scope)) return false
  if (!isRecord(value.priority_summary) || !isRecord(value.traceability) || !isRecord(value.completeness)) return false
  if (!Array.isArray(value.traceability.links) || !Array.isArray(value.traceability.coverage_gaps)) return false
  if (!Array.isArray(value.completeness.missing_sections)) return false
  return true
}

function isAnalysisRow(value: unknown): value is AnalysisRow {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' && typeof value.title === 'string' && typeof value.status === 'string' && typeof value.analysis_version === 'number'
}

function isSourceRow(value: unknown): value is SourceRow {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' && typeof value.analysis_id === 'string' && typeof value.display_name === 'string'
}

function isItemRow(value: unknown): value is ItemRow {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' && typeof value.analysis_id === 'string' && typeof value.item_key === 'string' && typeof value.title === 'string'
}

function isLinkRow(value: unknown): value is LinkRow {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' && typeof value.analysis_id === 'string' && typeof value.from_item_id === 'string' && typeof value.to_item_id === 'string'
}

function isRunRow(value: unknown): value is RunRow {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' && typeof value.analysis_id === 'string' && typeof value.status === 'string'
}

function arrayOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, index) => index % 2 === 1 ? <strong key={index} className="font-semibold">{part}</strong> : part)
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, index) => {
        if (line.startsWith('### ')) return <h4 key={index} className="mt-3 text-sm font-semibold">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={index} className="mt-3 text-base font-semibold">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={index} className="mt-4 text-lg font-bold">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={index} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={index} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={index} className="h-1" />
        return <p key={index} className="text-sm leading-6">{formatInline(line)}</p>
      })}
    </div>
  )
}

function confidenceNumber(confidence: Confidence | string | null | undefined) {
  if (confidence === 'high') return 0.9
  if (confidence === 'medium') return 0.65
  if (confidence === 'low') return 0.35
  return null
}

function collectItems(data: AgentResult): Array<{
  item_key: string
  category: string
  title: string
  statement: string
  rationale: string
  evidence_type: EvidenceType
  priority: Priority | null
  priority_rationale: string | null
  confidence: number | null
  sort_order: number
}> {
  const items: Array<{
    item_key: string
    category: string
    title: string
    statement: string
    rationale: string
    evidence_type: EvidenceType
    priority: Priority | null
    priority_rationale: string | null
    confidence: number | null
    sort_order: number
  }> = []
  const add = (value: unknown, category: string, offset: number, priority?: Priority, priorityRationale?: string) => {
    for (const [index, item] of arrayOf<EvidenceItem>(value).entries()) {
      if (!isRecord(item) || typeof item.item_id !== 'string' || typeof item.title !== 'string' || typeof item.statement !== 'string') continue
      items.push({
        item_key: item.item_id,
        category,
        title: item.title,
        statement: item.statement,
        rationale: typeof item.rationale === 'string' ? item.rationale : '',
        evidence_type: item.evidence_type,
        priority: priority ?? null,
        priority_rationale: priorityRationale ?? null,
        confidence: confidenceNumber(item.confidence),
        sort_order: offset + index,
      })
    }
  }
  add(data.business_objectives, 'objective', 0)
  add(data.stakeholders, 'stakeholder', 100)
  add(data.scope?.in_scope, 'scope-in', 200)
  add(data.scope?.out_of_scope, 'scope-out', 300)
  add(data.user_needs, 'user-need', 400)
  for (const [index, item] of arrayOf<Requirement>(data.functional_requirements).entries()) {
    if (!isRecord(item) || typeof item.item_id !== 'string' || typeof item.title !== 'string' || typeof item.statement !== 'string') continue
    items.push({ item_key: item.item_id, category: 'functional-requirement', title: item.title, statement: item.statement, rationale: typeof item.rationale === 'string' ? item.rationale : '', evidence_type: item.evidence_type, priority: item.priority, priority_rationale: item.priority_rationale, confidence: confidenceNumber(item.confidence), sort_order: 500 + index })
  }
  for (const [index, item] of arrayOf<Requirement>(data.non_functional_requirements).entries()) {
    if (!isRecord(item) || typeof item.item_id !== 'string' || typeof item.title !== 'string' || typeof item.statement !== 'string') continue
    items.push({ item_key: item.item_id, category: 'non-functional-requirement', title: item.title, statement: item.statement, rationale: typeof item.rationale === 'string' ? item.rationale : '', evidence_type: item.evidence_type, priority: item.priority, priority_rationale: item.priority_rationale, confidence: confidenceNumber(item.confidence), sort_order: 600 + index })
  }
  add(data.constraints, 'constraint', 700)
  add(data.dependencies, 'dependency', 800)
  add(data.risks, 'risk', 900)
  add(data.assumptions, 'assumption', 1000)
  for (const [index, item] of arrayOf<OpenQuestion>(data.open_questions).entries()) {
    if (!isRecord(item) || typeof item.item_id !== 'string' || typeof item.title !== 'string' || typeof item.question !== 'string') continue
    items.push({ item_key: item.item_id, category: 'open-question', title: item.title, statement: item.question, rationale: typeof item.why_it_matters === 'string' ? item.why_it_matters : '', evidence_type: item.evidence_type, priority: null, priority_rationale: null, confidence: confidenceNumber(item.confidence), sort_order: 1100 + index })
  }
  add(data.conflicts_and_ambiguities, 'conflict', 1200)
  add(data.success_criteria, 'success-criterion', 1300)
  return items
}

function mergeItemPatchIntoResult(data: AgentResult, itemId: string, patch: ItemPatch): AgentResult {
  const update = <T extends { item_id: string }>(items: T[]) => items.map((item) => item.item_id === itemId ? { ...item, ...patch } as T : item)
  return {
    ...data,
    business_objectives: update(data.business_objectives),
    stakeholders: update(data.stakeholders),
    scope: { in_scope: update(data.scope.in_scope), out_of_scope: update(data.scope.out_of_scope) },
    user_needs: update(data.user_needs),
    functional_requirements: update(data.functional_requirements),
    non_functional_requirements: update(data.non_functional_requirements),
    constraints: update(data.constraints),
    dependencies: update(data.dependencies),
    risks: update(data.risks),
    assumptions: update(data.assumptions),
    open_questions: update(data.open_questions),
    conflicts_and_ambiguities: update(data.conflicts_and_ambiguities),
    success_criteria: update(data.success_criteria),
  }
}

function removeItemFromResult(data: AgentResult, itemId: string): AgentResult {
  const remove = <T extends { item_id: string }>(items: T[]) => items.filter((item) => item.item_id !== itemId)
  return {
    ...data,
    business_objectives: remove(data.business_objectives),
    stakeholders: remove(data.stakeholders),
    scope: { in_scope: remove(data.scope.in_scope), out_of_scope: remove(data.scope.out_of_scope) },
    user_needs: remove(data.user_needs),
    functional_requirements: remove(data.functional_requirements),
    non_functional_requirements: remove(data.non_functional_requirements),
    constraints: remove(data.constraints),
    dependencies: remove(data.dependencies),
    risks: remove(data.risks),
    assumptions: remove(data.assumptions),
    open_questions: remove(data.open_questions),
    conflicts_and_ambiguities: remove(data.conflicts_and_ambiguities),
    success_criteria: remove(data.success_criteria),
  }
}

function AppContent() {
  const { user, authFetch } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [view, setView] = useState<'workspace' | 'intake' | 'review' | 'settings'>('workspace')
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRow | null>(null)
  const [sources, setSources] = useState<SourceRow[]>([])
  const [items, setItems] = useState<ItemRow[]>([])
  const [links, setLinks] = useState<LinkRow[]>([])
  const [runs, setRuns] = useState<RunRow[]>([])
  const [agentData, setAgentData] = useState<AgentResult | null>(null)
  const [intakeDraft, setIntakeDraft] = useState<IntakeDraft>({ title: '', industry: '', audience: '', description: '', sourceText: '' })
  const [fileStates, setFileStates] = useState<FileState[]>([])
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [runningAnalysis, setRunningAnalysis] = useState(false)
  const [analysisStage, setAnalysisStage] = useState('Preparing sources')
  const [error, setError] = useState<string | null>(null)
  const [sampleData, setSampleData] = useState(true)
  const [sampleIds, setSampleIds] = useState<string[]>([])
  const [existingAssetIds, setExistingAssetIds] = useState<string[]>([])
  const authFetchRef = useRef(authFetch)
  authFetchRef.current = authFetch

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('theme')
    const nextTheme = storedTheme === 'dark' ? 'dark' : 'light'
    setTheme(nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      window.localStorage.setItem('theme', next)
      return next
    })
  }, [])

  const loadAnalyses = useCallback(async () => {
    const response = await authFetch('/api/analyses')
    const body = await response.json() as { success?: boolean; data?: unknown; error?: string }
    if (!response.ok || body.success !== true || !Array.isArray(body.data)) throw new Error(body.error ?? 'Unable to load analyses.')
    const rows = body.data.filter(isAnalysisRow)
    setAnalyses(rows)
  }, [authFetch])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    const boot = async () => {
      setLoading(true)
      try {
        const authenticatedFetch = authFetchRef.current
        const seedResponse = await authenticatedFetch('/api/seed', { method: 'POST' })
        const seedBody = await seedResponse.json() as { success?: boolean; seeded?: boolean; sample_analysis_id?: string; error?: string }
        if (!seedResponse.ok || seedBody.success !== true) throw new Error(seedBody.error ?? 'Unable to prepare your workspace.')
        if (!cancelled && seedBody.seeded === true && typeof seedBody.sample_analysis_id === 'string') setSampleIds([seedBody.sample_analysis_id])

        const analysesResponse = await authenticatedFetch('/api/analyses')
        const analysesBody = await analysesResponse.json() as { success?: boolean; data?: unknown; error?: string }
        if (!analysesResponse.ok || analysesBody.success !== true || !Array.isArray(analysesBody.data)) throw new Error(analysesBody.error ?? 'Unable to load analyses.')
        if (!cancelled) setAnalyses(analysesBody.data.filter(isAnalysisRow))
      } catch (caught) {
        if (!cancelled) {
          const message = caught instanceof Error ? caught.message : 'Unable to open your workspace.'
          setError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => { cancelled = true }
  }, [user?.id])

  const openNewAnalysis = useCallback(() => {
    setSelectedAnalysis(null)
    setSources([])
    setItems([])
    setLinks([])
    setRuns([])
    setAgentData(null)
    setIntakeDraft({ title: '', industry: '', audience: '', description: '', sourceText: '' })
    setFileStates([])
    setExistingAssetIds([])
    setError(null)
    setView('intake')
  }, [])

  const parseList = async <T,>(response: Response, guard: (value: unknown) => value is T, label: string) => {
    const body = await response.json() as { success?: boolean; data?: unknown; error?: string }
    if (!response.ok || body.success !== true || !Array.isArray(body.data)) throw new Error(body.error ?? `Unable to load ${label}.`)
    return body.data.filter(guard)
  }

  const openAnalysis = useCallback(async (analysis: AnalysisRow) => {
    setLoadingAnalysis(true)
    setError(null)
    setSelectedAnalysis(analysis)
    setIntakeDraft({ title: analysis.title, industry: analysis.industry ?? '', audience: analysis.audience ?? '', description: analysis.description ?? '', sourceText: analysis.source_text ?? '' })
    try {
      const [sourceResponse, itemResponse, linkResponse, runResponse] = await Promise.all([
        authFetch(`/api/analysis_sources?analysis_id=${encodeURIComponent(analysis.id)}`),
        authFetch(`/api/analysis_items?analysis_id=${encodeURIComponent(analysis.id)}`),
        authFetch(`/api/traceability_links?analysis_id=${encodeURIComponent(analysis.id)}`),
        authFetch(`/api/analysis_runs?analysis_id=${encodeURIComponent(analysis.id)}`),
      ])
      const [nextSources, nextItems, nextLinks, nextRuns] = await Promise.all([
        parseList(sourceResponse, isSourceRow, 'sources'),
        parseList(itemResponse, isItemRow, 'analysis items'),
        parseList(linkResponse, isLinkRow, 'traceability links'),
        parseList(runResponse, isRunRow, 'analysis runs'),
      ])
      setSources(nextSources)
      setExistingAssetIds(nextSources.flatMap((source) => source.asset_id ? [source.asset_id] : []))
      setItems(nextItems)
      setLinks(nextLinks)
      setRuns(nextRuns)
      const latestRun = [...nextRuns].reverse().find((run) => run.status === 'completed')
      const requested = latestRun?.requested_sections
      const savedResult = isRecord(requested) ? requested.result : null
      if (isAgentResult(savedResult)) {
        setAgentData(savedResult)
        setView('review')
      } else if (analysis.status === 'draft') {
        setView('intake')
      } else {
        setAgentData(null)
        setError('The saved analysis is missing its structured result. Retry the analysis from the intake screen.')
        setView('intake')
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to open this analysis.'
      setError(message)
      toast.error(message)
    } finally {
      setLoadingAnalysis(false)
    }
  }, [authFetch])

  const saveDraft = useCallback(async (draft: IntakeDraft, notify = true) => {
    if (!draft.title.trim()) {
      toast.error('Add a project title before saving.')
      return null
    }
    const payload = { title: draft.title.trim(), industry: draft.industry.trim() || null, audience: draft.audience.trim() || null, description: draft.description.trim() || null, source_text: draft.sourceText }
    try {
      const response = await authFetch('/api/analyses', {
        method: selectedAnalysis ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedAnalysis ? { id: selectedAnalysis.id, ...payload } : payload),
      })
      const body = await response.json() as { success?: boolean; data?: unknown; error?: string }
      if (!response.ok || body.success !== true || !isAnalysisRow(body.data)) throw new Error(body.error ?? 'Unable to save this draft.')
      const savedRow = body.data as AnalysisRow
      setSelectedAnalysis(savedRow)
      setAnalyses((current) => current.some((row) => row.id === savedRow.id) ? current.map((row) => row.id === savedRow.id ? savedRow : row) : [savedRow, ...current])
      if (notify) toast.success('Draft saved')
      return body.data
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to save this draft.'
      toast.error(message)
      return null
    }
  }, [authFetch, selectedAnalysis])

  const runAnalysis = useCallback(async (draft: IntakeDraft, selectedFiles: File[]) => {
    if (!draft.title.trim()) {
      toast.error('Add a project title before analyzing.')
      return
    }
    if (!draft.sourceText.trim() && selectedFiles.length === 0) {
      toast.error('Add a problem statement or at least one supported document.')
      return
    }
    setRunningAnalysis(true)
    setError(null)
    setAnalysisStage('Preparing sources')
    const saved = await saveDraft(draft, false)
    if (!saved) {
      setRunningAnalysis(false)
      return
    }
    const analysis = saved as AnalysisRow
    try {
      let assetIds: string[] = [...existingAssetIds]
      if (selectedFiles.length > 0) {
        setAnalysisStage('Uploading supporting documents')
        setFileStates((current) => current.map((entry) => ({ ...entry, status: 'uploading' })))
        const uploadResult = await uploadFiles(selectedFiles)
        const returnedAssetIds = Array.isArray(uploadResult.asset_ids) ? uploadResult.asset_ids.filter((asset): asset is string => typeof asset === 'string') : []
        assetIds = Array.from(new Set([...assetIds, ...returnedAssetIds]))
        setExistingAssetIds(assetIds)
        setFileStates((current) => current.map((entry, index) => ({ ...entry, status: returnedAssetIds[index] ? 'uploaded' : 'failed', assetId: returnedAssetIds[index], message: returnedAssetIds[index] ? 'Uploaded securely' : 'Upload failed' })))
        if (!uploadResult.success && returnedAssetIds.length === 0) throw new Error(uploadResult.error ?? 'The document upload failed. Try again.')
        if (!uploadResult.success) toast.error('Some documents could not be uploaded; analysis will use the successful sources.')
        await Promise.all(selectedFiles.map((file, index) => authFetch('/api/analysis_sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis_id: analysis.id, source_type: 'uploaded_document', display_name: file.name, asset_id: returnedAssetIds[index] ?? null, mime_type: file.type || null, file_size: file.size, upload_status: returnedAssetIds[index] ? 'uploaded' : 'failed' }),
        })))
      }
      if (draft.sourceText.trim()) {
        await authFetch('/api/analysis_sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis_id: analysis.id, source_type: 'pasted_text', display_name: 'Problem statement', asset_id: null, mime_type: 'text/plain', file_size: draft.sourceText.length, upload_status: 'available' }),
        })
      }
      setAnalysisStage('Analyzing source material')
      setActiveAgentId(REQUIREMENTS_AGENT_ID)
      const message = [
        `Analyze the following business and product case for the project titled "${draft.title.trim()}".`,
        `Industry: ${draft.industry.trim() || 'Not provided'}. Audience: ${draft.audience.trim() || 'Not provided'}.`,
        `Project context: ${draft.description.trim() || 'Not provided'}.`,
        `Problem statement:\n${draft.sourceText.trim() || 'See uploaded documents.'}`,
        'Return the complete structured response contract. Distinguish explicit and inferred evidence, preserve source references, explain every priority, identify conflicts and gaps, and make human review visible.',
      ].join('\n\n')
      const agentResponse = await callAIAgent(message, REQUIREMENTS_AGENT_ID, { assets: assetIds })
      setActiveAgentId(null)
      if (!agentResponse.success || agentResponse.response?.status !== 'success') throw new Error(agentResponse.response?.message ?? 'The requirements analysis failed.')
      const resultPayload = agentResponse.response?.result
      if (!isAgentResult(resultPayload)) throw new Error('The agent returned an incomplete structured response. Your draft is preserved; retry when ready.')
      setAnalysisStage('Structuring traceability')
      const flattenedItems = collectItems(resultPayload)
      const traceabilityLinks = arrayOf<TraceabilityLink>(resultPayload.traceability?.links)
      const runResponse = await authFetch('/api/analysis_runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysis.id, run_type: 'full', status: 'completed', requested_sections: { result: resultPayload, requested_sections: ['all'] } }),
      })
      const runBody = await runResponse.json() as { success?: boolean; error?: string }
      if (!runResponse.ok || runBody.success !== true) throw new Error(runBody.error ?? 'The analysis completed but could not be saved.')
      const itemResponse = await authFetch('/api/analysis_items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysis.id, items: flattenedItems, replace_existing: true }),
      })
      const itemBody = await itemResponse.json() as { success?: boolean; data?: unknown; error?: string }
      if (!itemResponse.ok || itemBody.success !== true || !Array.isArray(itemBody.data)) throw new Error(itemBody.error ?? 'The analysis items could not be saved.')
      const linkResponse = await authFetch('/api/traceability_links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysis.id, links: traceabilityLinks }),
      })
      const linkBody = await linkResponse.json() as { success?: boolean; data?: unknown; error?: string }
      if (!linkResponse.ok || linkBody.success !== true || !Array.isArray(linkBody.data)) throw new Error(linkBody.error ?? 'Traceability links could not be saved.')
      const updateResponse = await authFetch('/api/analyses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: analysis.id, status: 'ready', analysis_version: Number.parseInt(resultPayload.analysis_version, 10) || 1 }),
      })
      const updateBody = await updateResponse.json() as { success?: boolean; data?: unknown; error?: string }
      if (!updateResponse.ok || updateBody.success !== true || !isAnalysisRow(updateBody.data)) throw new Error(updateBody.error ?? 'The completed analysis could not be finalized.')
      setSelectedAnalysis(updateBody.data)
      setAnalyses((current) => current.map((row) => row.id === analysis.id ? updateBody.data as AnalysisRow : row))
      setAgentData(resultPayload)
      setItems(itemBody.data.filter(isItemRow))
      setLinks(linkBody.data.filter(isLinkRow))
      setSources([])
      setRuns([])
      setView('review')
      toast.success('Analysis ready for review')
    } catch (caught) {
      setActiveAgentId(null)
      const message = caught instanceof Error ? caught.message : 'Analysis failed. Your draft remains available.'
      setError(message)
      toast.error(message)
      await loadAnalyses().catch(() => undefined)
    } finally {
      setRunningAnalysis(false)
      setAnalysisStage('Preparing sources')
    }
  }, [authFetch, existingAssetIds, loadAnalyses, saveDraft])

  const updateItem = useCallback(async (itemId: string, patch: ItemPatch) => {
    try {
      const response = await authFetch('/api/analysis_items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: itemId, ...patch }) })
      const body = await response.json() as { success?: boolean; data?: unknown; error?: string }
      if (!response.ok || body.success !== true || !isItemRow(body.data)) throw new Error(body.error ?? 'Unable to save the item.')
      setItems((current) => current.map((item) => item.id === itemId ? body.data as ItemRow : item))
      const changed = body.data as ItemRow
      setAgentData((current) => current ? mergeItemPatchIntoResult(current, changed.item_key, patch) : current)
      toast.success('Edit saved')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to save the edit.')
    }
  }, [authFetch])

  const deleteItem = useCallback(async (item: ItemRow) => {
    if (!window.confirm(`Delete ${item.item_key}? This cannot be undone.`)) return
    try {
      const response = await authFetch(`/api/analysis_items?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      const body = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || body.success !== true) throw new Error(body.error ?? 'Unable to delete the item.')
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      setAgentData((current) => current ? removeItemFromResult(current, item.item_key) : current)
      toast.success('Item deleted')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to delete the item.')
    }
  }, [authFetch])

  const addManualRequirement = useCallback(async () => {
    if (!selectedAnalysis) return
    const nextNumber = (agentData?.functional_requirements.length ?? 0) + 1
    const itemKey = `FR-${String(nextNumber).padStart(2, '0')}`
    const payload = { analysis_id: selectedAnalysis.id, item_key: itemKey, category: 'functional-requirement', title: 'New requirement', statement: 'Describe the behavior the product must support.', rationale: 'Added by the analyst for review.', evidence_type: 'unknown', priority: 'Should', priority_rationale: 'Analyst recommendation pending validation.', confidence: null, is_user_edited: true, sort_order: 500 + nextNumber }
    try {
      const response = await authFetch('/api/analysis_items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysis_id: selectedAnalysis.id, items: [payload] }) })
      const body = await response.json() as { success?: boolean; data?: unknown; error?: string }
      if (!response.ok || body.success !== true || !Array.isArray(body.data)) throw new Error(body.error ?? 'Unable to add a requirement.')
      const added = body.data.filter(isItemRow)[0]
      if (!added) throw new Error('The new requirement was not returned by the server.')
      setItems((current) => [...current, added])
      if (agentData) {
        const newRequirement: Requirement = { item_id: itemKey, title: payload.title, statement: payload.statement, rationale: payload.rationale, evidence_type: 'unknown', source_references: [], priority: 'Should', priority_rationale: payload.priority_rationale, priority_basis: ['unknown'], priority_is_recommendation: true, confidence: 'unknown', review_status: 'needs_review', linked_objective_ids: [], linked_user_need_ids: [], linked_success_criteria_ids: [], dependency_ids: [], risk_ids: [], notes: 'Manual requirement added by the analyst.' }
        setAgentData({ ...agentData, functional_requirements: [...agentData.functional_requirements, newRequirement] })
      }
      toast.success('Requirement added')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to add a requirement.')
    }
  }, [agentData, authFetch, selectedAnalysis])

  const saveLink = useCallback(async (payload: { from_item_id: string; to_item_id: string; link_type: string; evidence_note: string; is_inferred: boolean }) => {
    if (!selectedAnalysis) return
    try {
      const response = await authFetch('/api/traceability_links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysis_id: selectedAnalysis.id, links: [payload] }) })
      const body = await response.json() as { success?: boolean; data?: unknown; error?: string }
      if (!response.ok || body.success !== true || !Array.isArray(body.data)) throw new Error(body.error ?? 'Unable to save the traceability link.')
      setLinks((current) => [...current, ...(body.data as unknown[]).filter(isLinkRow)])
      toast.success('Traceability link saved')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to save the traceability link.')
    }
  }, [authFetch, selectedAnalysis])

  const deleteLink = useCallback(async (linkId: string) => {
    try {
      const response = await authFetch(`/api/traceability_links?id=${encodeURIComponent(linkId)}`, { method: 'DELETE' })
      const body = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || body.success !== true) throw new Error(body.error ?? 'Unable to remove the link.')
      setLinks((current) => current.filter((link) => link.id !== linkId))
      toast.success('Traceability link removed')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to remove the traceability link.')
    }
  }, [authFetch])

  const duplicateAnalysis = useCallback(async (analysis: AnalysisRow) => {
    try {
      const response = await authFetch('/api/analyses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'duplicate', id: analysis.id }) })
      const body = await response.json() as { success?: boolean; data?: unknown; error?: string }
      if (!response.ok || body.success !== true || !isAnalysisRow(body.data)) throw new Error(body.error ?? 'Unable to duplicate the analysis.')
      setAnalyses((current) => [body.data as AnalysisRow, ...current])
      toast.success('Analysis duplicated')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to duplicate the analysis.')
    }
  }, [authFetch])

  const archiveAnalysis = useCallback(async (analysis: AnalysisRow) => {
    try {
      const response = await authFetch('/api/analyses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: analysis.id, status: analysis.status === 'archived' ? 'draft' : 'archived' }) })
      const body = await response.json() as { success?: boolean; data?: unknown; error?: string }
      if (!response.ok || body.success !== true || !isAnalysisRow(body.data)) throw new Error(body.error ?? 'Unable to update archive status.')
      setAnalyses((current) => current.map((row) => row.id === analysis.id ? body.data as AnalysisRow : row))
      if (selectedAnalysis?.id === analysis.id) setSelectedAnalysis(body.data as AnalysisRow)
      toast.success(analysis.status === 'archived' ? 'Analysis restored' : 'Analysis archived')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to update archive status.')
    }
  }, [authFetch, selectedAnalysis])

  const deleteAnalysis = useCallback(async (analysis: AnalysisRow) => {
    if (!window.confirm(`Delete “${analysis.title}”? All saved sources, items, runs, and links will be removed.`)) return
    try {
      const response = await authFetch(`/api/analyses?id=${encodeURIComponent(analysis.id)}`, { method: 'DELETE' })
      const body = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || body.success !== true) throw new Error(body.error ?? 'Unable to delete the analysis.')
      setAnalyses((current) => current.filter((row) => row.id !== analysis.id))
      if (selectedAnalysis?.id === analysis.id) {
        setSelectedAnalysis(null)
        setView('workspace')
      }
      toast.success('Analysis deleted')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to delete the analysis.')
    }
  }, [authFetch, selectedAnalysis])

  const visibleAnalyses = useMemo(() => sampleData ? analyses : analyses.filter((analysis) => !sampleIds.includes(analysis.id)), [analyses, sampleData, sampleIds])
  const currentRequirements = useMemo(() => items.filter((item) => item.category === 'functional-requirement' || item.category === 'non-functional-requirement'), [items])
  const coverage = agentData ? Math.round(agentData.completeness.overall_score <= 1 ? agentData.completeness.overall_score * 100 : agentData.completeness.overall_score) : 0
  const readyCount = visibleAnalyses.filter((analysis) => analysis.status === 'ready').length
  const averageCoverage = visibleAnalyses.length > 0 && sampleData ? Math.round(visibleAnalyses.reduce((sum, analysis) => sum + (analysis.status === 'ready' ? coverage : 0), 0) / visibleAnalyses.length) : 0

  const handleSampleToggle = (enabled: boolean) => {
    setSampleData(enabled)
    if (!enabled && selectedAnalysis && sampleIds.includes(selectedAnalysis.id)) {
      setSelectedAnalysis(null)
      setView('workspace')
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-foreground"><div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Preparing your private workspace</div></div>
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground antialiased">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setView('workspace')} className="flex min-h-10 items-center gap-3 rounded-md px-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]">
            <span className="grid h-7 w-7 rotate-45 place-items-center rounded-sm bg-primary"><span className="h-2.5 w-2.5 -rotate-45 bg-primary-foreground" /></span>
            <span><span className="block text-sm font-bold tracking-tight">Requirement Lens</span><span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground sm:block">Private analysis workspace</span></span>
          </button>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 lg:flex" aria-label="Requirements Analysis Agent status">
              <span className={`h-2 w-2 rounded-full ${activeAgentId === REQUIREMENTS_AGENT_ID ? 'animate-pulse bg-primary' : 'bg-emerald-600'}`} />
              <span className="text-xs font-medium">Requirements Analysis Agent</span>
              <span className="text-[10px] text-muted-foreground">{activeAgentId === REQUIREMENTS_AGENT_ID ? 'Turning sources into requirements' : 'Ready · source-aware analysis'}</span>
            </div>
            <button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} className="grid min-h-10 min-w-10 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <UserMenu />
          </div>
        </div>
      </header>
      {error && <div className="mx-auto flex max-w-[1500px] items-start gap-3 px-4 pt-4 sm:px-6 lg:px-8 print:hidden"><div className="flex w-full items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">{error}</span><button type="button" onClick={() => setError(null)} className="rounded p-1 hover:bg-destructive/10" aria-label="Dismiss error">×</button></div></div>}
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 print:p-0">
        {view === 'workspace' && <WorkspaceView analyses={visibleAnalyses} totalAnalyses={visibleAnalyses.length} readyCount={readyCount} averageCoverage={averageCoverage} onNew={openNewAnalysis} onOpen={openAnalysis} onArchive={archiveAnalysis} onDuplicate={duplicateAnalysis} onDelete={deleteAnalysis} onNavigate={setView} sampleData={sampleData} onSampleToggle={handleSampleToggle} userEmail={typeof user?.email === 'string' ? user.email : ''} />}
        {view === 'settings' && <SettingsView theme={theme} onToggleTheme={toggleTheme} onBack={() => setView('workspace')} />}
        {view === 'intake' && <IntakeView draft={intakeDraft} onChange={setIntakeDraft} files={fileStates} onFilesChange={setFileStates} onBack={() => setView('workspace')} onSave={() => saveDraft(intakeDraft)} onAnalyze={() => runAnalysis(intakeDraft, fileStates.map((entry) => entry.file))} running={runningAnalysis} stage={analysisStage} agentActive={activeAgentId === REQUIREMENTS_AGENT_ID} selectedAnalysis={selectedAnalysis} />}
        {view === 'review' && selectedAnalysis && agentData && <ReviewView analysis={selectedAnalysis} data={agentData} sources={sources} items={items} links={links} runs={runs} coverage={coverage} loading={loadingAnalysis} onBack={() => setView('workspace')} onRegenerate={() => runAnalysis(intakeDraft, fileStates.map((entry) => entry.file))} onExport={() => { document.title = `${selectedAnalysis.title} — Requirements Report`; toast.success('Print-ready PDF report opened. Choose “Save to PDF” in the print dialog.'); window.print() }} onUpdateItem={updateItem} onDeleteItem={deleteItem} onAddRequirement={addManualRequirement} onSaveLink={saveLink} onDeleteLink={deleteLink} agentActive={activeAgentId === REQUIREMENTS_AGENT_ID} renderMarkdown={renderMarkdown} />}
        {view === 'review' && (!selectedAnalysis || !agentData) && <div className="flex min-h-[50vh] items-center justify-center"><button type="button" onClick={() => setView('workspace')} className="rounded-md border border-border px-4 py-3 text-sm font-semibold hover:bg-muted">Return to workspace</button></div>}
      </main>
      <div className="hidden print:block"><PrintFooter analysis={selectedAnalysis} data={agentData} exportLabel="Latest saved version" renderMarkdown={renderMarkdown} /></div>
    </div>
  )
}

function SettingsView({ theme, onToggleTheme, onBack }: { theme: 'light' | 'dark'; onToggleTheme: () => void; onBack: () => void }) {
  return <section className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"><div className="mb-8 flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Workspace settings</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Keep your review environment clear.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Theme is a local interface preference. Your analyses and source material remain in your private database workspace.</p></div><button type="button" onClick={onBack} className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Back</button></div><div className="rounded-lg border border-border bg-card p-6 shadow-sm"><div className="flex items-center justify-between gap-4"><div><h2 className="text-base font-semibold">Appearance</h2><p className="mt-1 text-sm text-muted-foreground">Use the {theme} theme across the analysis workspace.</p></div><button type="button" onClick={onToggleTheme} className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{theme === 'dark' ? 'Use light theme' : 'Use dark theme'}</button></div></div></section>
}

function PrintFooter({ analysis, data, exportLabel, renderMarkdown }: { analysis: AnalysisRow | null; data: AgentResult | null; exportLabel: string; renderMarkdown: (text: string) => ReactNode }) {
  if (!analysis || !data) return null
  return <article className="bg-white p-10 text-black"><div className="mb-8 border-b border-black/15 pb-6"><p className="font-mono text-xs uppercase tracking-[0.18em] text-black/60">Requirement Lens · Requirements report</p><h1 className="mt-3 text-3xl font-bold">{analysis.title}</h1><p className="mt-2 text-sm text-black/60">Version {analysis.analysis_version} · {exportLabel} · {data.source_inventory.length} sources</p><p className="mt-2 text-xs text-black/60">Industry: {analysis.industry ?? 'Not provided'} · Audience: {analysis.audience ?? 'Not provided'} · Status: {analysis.status}</p></div><section className="mb-8"><h2 className="text-xl font-bold">Executive summary</h2><div className="mt-3">{renderMarkdown(data.executive_summary)}</div></section><ReportPrintSection title="Business objectives" items={data.business_objectives} renderMarkdown={renderMarkdown} /><ReportPrintSection title="Stakeholders" items={data.stakeholders} renderMarkdown={renderMarkdown} /><ReportPrintSection title="In scope" items={data.scope.in_scope} renderMarkdown={renderMarkdown} /><ReportPrintSection title="Out of scope" items={data.scope.out_of_scope} renderMarkdown={renderMarkdown} /><ReportPrintSection title="User needs" items={data.user_needs} renderMarkdown={renderMarkdown} /><ReportPrintSection title="Functional requirements" items={data.functional_requirements} renderMarkdown={renderMarkdown} requirements /><ReportPrintSection title="Non-functional requirements" items={data.non_functional_requirements} renderMarkdown={renderMarkdown} requirements /><ReportPrintSection title="Constraints" items={data.constraints} renderMarkdown={renderMarkdown} /><ReportPrintSection title="Dependencies" items={data.dependencies} renderMarkdown={renderMarkdown} /><ReportPrintSection title="Risks" items={data.risks} renderMarkdown={renderMarkdown} /><ReportPrintSection title="Assumptions" items={data.assumptions} renderMarkdown={renderMarkdown} /><ReportPrintSection title="Success criteria" items={data.success_criteria} renderMarkdown={renderMarkdown} /><section className="mt-8"><h2 className="text-xl font-bold">Prioritization</h2><p className="mt-3 text-sm">Must: {data.priority_summary.must_count} · Should: {data.priority_summary.should_count} · Could: {data.priority_summary.could_count} · Won’t for now: {data.priority_summary.wont_for_now_count}</p><p className="mt-2 text-sm">{data.priority_summary.rationale}</p><p className="mt-2 text-xs text-black/60">{data.priority_summary.recommendation_notice}</p></section><section className="mt-8"><h2 className="text-xl font-bold">Open questions and conflicts</h2><div className="mt-3 space-y-3">{data.open_questions.map((question) => <div key={question.item_id} className="border-b border-black/10 pb-3"><p className="font-semibold">{question.item_id} · {question.title}</p><p className="mt-1 text-sm">{question.question}</p><p className="mt-1 text-xs text-black/60">Owner: {question.suggested_owner} · Urgency: {question.urgency} · Why it matters: {question.why_it_matters}</p></div>)}{data.conflicts_and_ambiguities.map((conflict) => <div key={conflict.item_id} className="border-b border-black/10 pb-3"><p className="font-semibold">{conflict.item_id} · {conflict.title} · {conflict.severity}</p><p className="mt-1 text-sm">{conflict.description}</p><p className="mt-1 text-xs text-black/60">Resolution: {conflict.recommended_resolution} · Status: {conflict.resolution_status}</p></div>)}</div></section><section className="mt-8"><h2 className="text-xl font-bold">Traceability</h2><p className="mt-2 text-sm">{data.traceability.matrix_notes}</p><p className="mt-2 text-sm">{data.traceability.links.length} links · {data.traceability.coverage_gaps.length} coverage gaps · {data.traceability.orphan_requirement_ids.length} orphan requirements · {data.traceability.uncovered_success_criterion_ids.length} uncovered success criteria</p><div className="mt-4 space-y-2">{data.traceability.coverage_gaps.map((gap) => <div key={gap.item_id} className="border-b border-black/10 pb-2 text-xs"><p className="font-semibold">{gap.item_id} · {gap.gap_type} · {gap.severity}</p><p>{gap.description} Next: {gap.recommended_action}</p></div>)}</div></section><section className="mt-8"><h2 className="text-xl font-bold">Review guidance</h2><div className="mt-3 space-y-2">{data.review_guidance.map((guidance) => <div key={guidance.guidance_id} className="border-b border-black/10 pb-2 text-xs"><p className="font-semibold">{guidance.guidance_id} · {guidance.category} · {guidance.severity}</p><p>{guidance.message} Next: {guidance.recommended_action}</p></div>)}</div></section></article>
}

function ReportPrintSection({ title, items, renderMarkdown, requirements }: { title: string; items: EvidenceItem[]; renderMarkdown: (text: string) => ReactNode; requirements?: boolean }) {
  return <section className="mt-8"><h2 className="text-xl font-bold">{title}</h2><div className="mt-3 space-y-4">{items.map((item) => { const requirement = item as Requirement; return <div key={item.item_id} className="border-b border-black/10 pb-4"><p className="font-semibold">{item.item_id} · {item.title}</p><div className="mt-1">{renderMarkdown(item.statement)}</div><p className="mt-2 text-xs text-black/60">Evidence: {item.evidence_type} · Confidence: {item.confidence} · Review: {item.review_status}</p><p className="mt-1 text-xs text-black/60">Rationale: {item.rationale} · Notes: {item.notes}</p>{requirements && <p className="mt-1 text-xs text-black/60">Priority: {requirement.priority} · Recommendation rationale: {requirement.priority_rationale} · Basis: {requirement.priority_basis.join(', ')} · Objectives: {requirement.linked_objective_ids.join(', ') || 'None'} · Needs: {requirement.linked_user_need_ids.join(', ') || 'None'} · Measures: {requirement.linked_success_criteria_ids.join(', ') || 'None'}</p>}{item.source_references.length > 0 && <p className="mt-1 text-xs text-black/60">Sources: {item.source_references.map((reference) => `${reference.source_id} (${reference.evidence_label}, ${reference.locator})`).join(' · ')}</p>}</div> })}</div></section>
}

export default function Page() {
  return <AuthProvider><Toaster richColors position="top-right" /><ProtectedRoute unauthenticatedFallback={<AuthScreen />}><AppContent /></ProtectedRoute></AuthProvider>
}
