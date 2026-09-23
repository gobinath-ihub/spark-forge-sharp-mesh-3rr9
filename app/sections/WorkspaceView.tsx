'use client'

import { useMemo, useState } from 'react'
import { Archive, ChevronDown, Copy, FileText, FolderOpen, MoreHorizontal, Plus, Search, Settings, Trash2 } from 'lucide-react'
import type { AnalysisRow, AnalysisStatus } from '@/app/page'

interface WorkspaceProps {
  analyses: AnalysisRow[]
  totalAnalyses: number
  readyCount: number
  averageCoverage: number
  onNew: () => void
  onOpen: (analysis: AnalysisRow) => void
  onArchive: (analysis: AnalysisRow) => void
  onDuplicate: (analysis: AnalysisRow) => void
  onDelete: (analysis: AnalysisRow) => void
  onNavigate: (view: 'workspace' | 'settings') => void
  sampleData: boolean
  onSampleToggle: (enabled: boolean) => void
  userEmail: string
}

export default function WorkspaceView({ analyses, totalAnalyses, readyCount, averageCoverage, onNew, onOpen, onArchive, onDuplicate, onDelete, onNavigate, sampleData, onSampleToggle, userEmail }: WorkspaceProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | AnalysisStatus>('all')
  const [sort, setSort] = useState<'updated' | 'title'>('updated')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [activeNav, setActiveNav] = useState<'all' | 'recent' | 'archived'>('all')

  const filteredAnalyses = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const next = analyses.filter((analysis) => {
      const matchesNav = activeNav === 'archived' ? analysis.status === 'archived' : activeNav === 'recent' ? analysis.status !== 'archived' : true
      const matchesStatus = status === 'all' || analysis.status === status
      const matchesQuery = !normalized || [analysis.title, analysis.industry, analysis.audience, analysis.description].some((value) => value?.toLowerCase().includes(normalized))
      return matchesNav && matchesStatus && matchesQuery
    })
    return [...next].sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : String(b.updated_at ?? b.created_at ?? '').localeCompare(String(a.updated_at ?? a.created_at ?? '')))
  }, [activeNav, analyses, query, sort, status])

  return <div className="grid min-h-[calc(100vh-6rem)] animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none lg:grid-cols-[220px_minmax(0,1fr)]">
    <aside className="hidden border-r border-border/70 pr-6 lg:block">
      <div className="mb-7 flex items-center gap-2 px-2"><span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground"><FolderOpen className="h-3.5 w-3.5" /></span><span className="text-sm font-semibold">Workspace</span></div>
      <nav className="space-y-1" aria-label="Workspace navigation">
        <NavButton active={activeNav === 'all'} icon={<FolderOpen className="h-4 w-4" />} label="All analyses" onClick={() => setActiveNav('all')} count={analyses.filter((analysis) => analysis.status !== 'archived').length} />
        <NavButton active={activeNav === 'recent'} icon={<FileText className="h-4 w-4" />} label="Recent" onClick={() => setActiveNav('recent')} />
        <NavButton active={activeNav === 'archived'} icon={<Archive className="h-4 w-4" />} label="Archived" onClick={() => setActiveNav('archived')} count={analyses.filter((analysis) => analysis.status === 'archived').length} />
        <NavButton active={false} icon={<Settings className="h-4 w-4" />} label="Settings" onClick={() => onNavigate('settings')} />
      </nav>
      <div className="mt-12 border-t border-border pt-5 px-2"><p className="truncate text-xs font-semibold">{userEmail || 'Private analyst'}</p><p className="mt-1 text-[11px] text-muted-foreground">Business analysis workspace</p></div>
    </aside>
    <section className="min-w-0 lg:pl-8">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Workspace / {activeNav}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your analyses</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Resume work or start with new source material.</p></div><button type="button" onClick={onNew} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"><Plus className="h-4 w-4" />New analysis</button></div>
      <div className="mb-7 grid gap-px overflow-hidden rounded-lg border border-border bg-border shadow-sm sm:grid-cols-3"><Metric value={totalAnalyses} label="Total analyses" /><Metric value={readyCount} label="Ready for review" /><Metric value={`${averageCoverage}%`} label="Average traceability" /></div>
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search analyses by title or context…" className="min-h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20" /></label><div className="flex flex-wrap gap-2"><select value={status} onChange={(event) => setStatus(event.target.value as 'all' | AnalysisStatus)} className="min-h-11 rounded-md border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"><option value="all">All statuses</option><option value="draft">Draft</option><option value="analyzing">Analyzing</option><option value="ready">Ready</option><option value="archived">Archived</option></select><select value={sort} onChange={(event) => setSort(event.target.value as 'updated' | 'title')} className="min-h-11 rounded-md border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"><option value="updated">Last updated</option><option value="title">Title A–Z</option></select></div></div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 bg-card px-4 py-3"><div><p className="text-xs font-semibold">Sample Data</p><p className="text-[11px] text-muted-foreground">Show a realistic example analysis to explore the workflow.</p></div><button type="button" role="switch" aria-checked={sampleData} onClick={() => onSampleToggle(!sampleData)} className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${sampleData ? 'bg-primary' : 'bg-muted-foreground/40'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${sampleData ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
      {filteredAnalyses.length === 0 ? <EmptyWorkspace hasQuery={Boolean(query.trim())} archived={activeNav === 'archived'} onNew={onNew} onClear={() => { setQuery(''); setStatus('all') }} /> : <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="hidden grid-cols-[minmax(240px,2.5fr)_1fr_.55fr_.7fr_1fr_44px] gap-4 border-b border-border bg-muted/50 px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid"><span>Project</span><span>Status</span><span>Reqs</span><span>Coverage</span><span>Updated</span><span /></div>{filteredAnalyses.map((analysis) => <ProjectRow key={analysis.id} analysis={analysis} menuOpen={menuId === analysis.id} onToggleMenu={() => setMenuId(menuId === analysis.id ? null : analysis.id)} onOpen={() => onOpen(analysis)} onArchive={() => { onArchive(analysis); setMenuId(null) }} onDuplicate={() => { onDuplicate(analysis); setMenuId(null) }} onDelete={() => { onDelete(analysis); setMenuId(null) }} />)}</div>}
    </section>
  </div>
}

function NavButton({ active, icon, label, count, onClick }: { active: boolean; icon: React.ReactNode; label: string; count?: number; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{icon}<span className="min-w-0 flex-1 truncate">{label}</span>{count !== undefined && <span className={`font-mono text-[10px] ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{count}</span>}</button>
}

function Metric({ value, label }: { value: number | string; label: string }) {
  return <div className="bg-card p-5"><p className="font-serif text-3xl tabular-nums tracking-tight">{value}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p></div>
}

function ProjectRow({ analysis, menuOpen, onToggleMenu, onOpen, onArchive, onDuplicate, onDelete }: { analysis: AnalysisRow; menuOpen: boolean; onToggleMenu: () => void; onOpen: () => void; onArchive: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const requirementCount = analysis.status === 'ready' ? '—' : '—'
  return <div className="relative grid gap-3 border-b border-border px-4 py-4 last:border-b-0 transition-colors hover:bg-muted/30 md:grid-cols-[minmax(240px,2.5fr)_1fr_.55fr_.7fr_1fr_44px] md:items-center md:gap-4"><button type="button" onClick={onOpen} className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:rounded-sm"><span className="block truncate text-sm font-semibold">{analysis.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{analysis.industry || analysis.audience || 'No context added'}{analysis.description ? ` · ${analysis.description}` : ''}</span></button><div className="flex items-center gap-2 md:block"><StatusBadge status={analysis.status} /><span className="ml-auto text-xs text-muted-foreground md:hidden">{formatUpdated(analysis.updated_at ?? analysis.created_at)}</span></div><span className="hidden text-sm tabular-nums text-muted-foreground md:block">{requirementCount}</span><span className="hidden text-sm tabular-nums text-muted-foreground md:block">{analysis.status === 'ready' ? 'Review' : '—'}</span><span className="hidden text-xs text-muted-foreground md:block">{formatUpdated(analysis.updated_at ?? analysis.created_at)}</span><div className="absolute right-4 top-4 md:static"><button type="button" onClick={onToggleMenu} aria-label={`Actions for ${analysis.title}`} className="grid min-h-10 min-w-10 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><MoreHorizontal className="h-4 w-4" /></button>{menuOpen && <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-lg"><ActionButton icon={<FolderOpen className="h-3.5 w-3.5" />} label="Open analysis" onClick={onOpen} /><ActionButton icon={<Copy className="h-3.5 w-3.5" />} label="Duplicate" onClick={onDuplicate} /><ActionButton icon={<Archive className="h-3.5 w-3.5" />} label={analysis.status === 'archived' ? 'Restore' : 'Archive'} onClick={onArchive} /><ActionButton danger icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" onClick={onDelete} /></div>}</div></div>
}

function ActionButton({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`flex min-h-9 w-full items-center gap-2 rounded px-2 text-left text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${danger ? 'text-destructive' : ''}`}>{icon}{label}</button>
}

function StatusBadge({ status }: { status: AnalysisStatus }) {
  const labels: Record<AnalysisStatus, string> = { draft: 'Draft', analyzing: 'Analyzing', ready: 'Ready', archived: 'Archived' }
  const styles: Record<AnalysisStatus, string> = { draft: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300', analyzing: 'border-primary/30 bg-primary/10 text-primary', ready: 'border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300', archived: 'border-border bg-muted text-muted-foreground' }
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{labels[status]}</span>
}

function EmptyWorkspace({ hasQuery, archived, onNew, onClear }: { hasQuery: boolean; archived: boolean; onNew: () => void; onClear: () => void }) {
  return <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted"><Search className="h-5 w-5 text-muted-foreground" /></div><h2 className="mt-5 text-lg font-semibold">{hasQuery ? 'No matching analyses' : archived ? 'No archived analyses' : 'Your workspace is ready'}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{hasQuery ? 'Try a different title, context term, or status filter.' : archived ? 'Archive a project when it is no longer active; it will appear here for later reference.' : 'Start with a business problem, meeting notes, or a supporting document.'}</p><button type="button" onClick={hasQuery ? onClear : onNew} className="mt-6 min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{hasQuery ? 'Clear filters' : archived ? 'View all analyses' : 'New analysis'}</button></div>
}

function formatUpdated(value?: string) {
  if (!value) return 'Not updated'
  const normalized = value.replace('T', ' ').replace(/\.\d+Z$/, '')
  return normalized.length > 16 ? normalized.slice(0, 16) : normalized
}
