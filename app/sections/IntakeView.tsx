'use client'

import { useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Check, FileText, Loader2, Paperclip, Trash2, Upload, X } from 'lucide-react'
import type { AnalysisRow, FileState, IntakeDraft } from '@/app/page'

interface IntakeProps {
  draft: IntakeDraft
  onChange: (draft: IntakeDraft) => void
  files: FileState[]
  onFilesChange: (files: FileState[]) => void
  onBack: () => void
  onSave: () => void
  onAnalyze: () => void
  running: boolean
  stage: string
  agentActive: boolean
  selectedAnalysis: AnalysisRow | null
}

const ACCEPTED = ['.pdf', '.txt', '.csv', '.md', '.markdown', '.doc', '.docx', '.xls', '.xlsx']
const MAX_BYTES = 25 * 1024 * 1024

export default function IntakeView({ draft, onChange, files, onFilesChange, onBack, onSave, onAnalyze, running, stage, agentActive, selectedAnalysis }: IntakeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [validation, setValidation] = useState<string | null>(null)

  const addFiles = (incoming: File[]) => {
    const next: FileState[] = []
    for (const file of incoming) {
      const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
      if (!ACCEPTED.includes(extension)) {
        setValidation(`${file.name} is not a supported format. Use PDF, Word, Excel, text, Markdown, or CSV.`)
        continue
      }
      if (file.size > MAX_BYTES) {
        setValidation(`${file.name} is larger than 25 MB. Choose a smaller file.`)
        continue
      }
      if (files.some((existing) => existing.file.name === file.name && existing.file.size === file.size)) continue
      next.push({ file, status: 'ready' })
    }
    if (next.length > 0) {
      setValidation(null)
      onFilesChange([...files, ...next])
    }
  }

  const isReady = Boolean(draft.title.trim() && (draft.sourceText.trim() || files.length > 0))

  return <section className="animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><button type="button" onClick={onBack} className="mb-5 inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowLeft className="h-3.5 w-3.5" />Back to workspace</button><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{selectedAnalysis ? 'Edit draft' : 'New analysis'}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Describe the business problem</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Add the context your stakeholders already have. The analysis will identify what is still missing.</p></div><button type="button" onClick={onSave} disabled={running || !draft.title.trim()} className="min-h-10 rounded-md border border-border bg-background px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Save draft</button></div>
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.5fr)_380px]">
      <div className="min-w-0 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7"><div className="mb-7 flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted"><FileText className="h-4 w-4 text-muted-foreground" /></span><div><h2 className="text-base font-semibold">Project details</h2><p className="mt-1 text-xs text-muted-foreground">Give the analysis a stable identity and enough context to ground its findings.</p></div></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Project title" value={draft.title} placeholder="e.g. Claims intake modernization" onChange={(value) => onChange({ ...draft, title: value })} required /><Field label="Industry" value={draft.industry} placeholder="e.g. Insurance operations" onChange={(value) => onChange({ ...draft, industry: value })} /><Field label="Primary audience" value={draft.audience} placeholder="e.g. Claims teams and brokers" onChange={(value) => onChange({ ...draft, audience: value })} /><Field label="Known constraints" value={draft.description} placeholder="Optional context, timeline, or boundaries" onChange={(value) => onChange({ ...draft, description: value })} /></div><div className="mt-6"><label htmlFor="problem-statement" className="mb-2 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.08em]">Business problem <span className="font-normal normal-case tracking-normal text-muted-foreground">Required if no document is attached</span></label><textarea id="problem-statement" value={draft.sourceText} onChange={(event) => onChange({ ...draft, sourceText: event.target.value })} placeholder="Describe what is happening today, who is affected, and what the organization is trying to improve…" className="min-h-[260px] w-full resize-y rounded-md border border-border bg-background p-4 text-sm leading-7 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20" /><p className="mt-2 text-xs text-muted-foreground">Include explicit goals, pain points, measures, or decisions already made. The agent will distinguish facts from inference.</p></div></div>
      <div className="min-w-0 space-y-5"><div className="rounded-lg border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted"><Paperclip className="h-4 w-4 text-muted-foreground" /></span><div><h2 className="text-base font-semibold">Supporting documents</h2><p className="mt-1 text-xs text-muted-foreground">Combine source files with your written problem.</p></div></div><button type="button" onClick={() => fileInputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true) }} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)) }} className={`flex min-h-44 w-full flex-col items-center justify-center rounded-md border border-dashed px-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40'}`}><Upload className="h-6 w-6 text-muted-foreground" /><span className="mt-4 text-sm font-semibold">Drop files here</span><span className="mt-1 text-xs text-muted-foreground">or choose PDF, Word, Excel, text, or CSV</span><span className="mt-3 font-mono text-[10px] text-muted-foreground">25 MB max per file</span></button><input ref={fileInputRef} type="file" multiple accept={ACCEPTED.join(',')} className="hidden" onChange={(event) => addFiles(Array.from(event.target.files ?? []))} />{validation && <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{validation}</span><button type="button" onClick={() => setValidation(null)} aria-label="Dismiss validation error" className="ml-auto"><X className="h-3.5 w-3.5" /></button></div>}{files.length > 0 && <div className="mt-4 space-y-2">{files.map((entry, index) => <FileRow key={`${entry.file.name}-${entry.file.size}-${index}`} entry={entry} onRemove={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))} />)}</div>}<p className="mt-4 text-[11px] leading-5 text-muted-foreground">Files are uploaded securely for this analysis and stored as metadata for source traceability.</p></div>
        <div className="rounded-lg bg-primary p-5 text-primary-foreground shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary-foreground/60">Readiness</p><h2 className="mt-2 text-lg font-bold">{running ? stage : isReady ? 'Ready to analyze' : 'Add usable evidence'}</h2></div>{running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5 text-primary-foreground/70" />}</div><div className="mt-5 space-y-0 border-t border-primary-foreground/20"><ReadinessRow label="Problem statement" value={draft.sourceText.trim() ? 'Included' : 'Needed'} ready={Boolean(draft.sourceText.trim())} /><ReadinessRow label="Supporting sources" value={files.length ? `${files.length} file${files.length === 1 ? '' : 's'}` : 'Optional'} ready={files.length > 0} /><ReadinessRow label="Estimated sections" value="16" ready={isReady} /></div><button type="button" onClick={onAnalyze} disabled={running || !isReady} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-foreground px-4 text-sm font-bold text-primary transition-colors hover:bg-primary-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary">{running ? <><Loader2 className="h-4 w-4 animate-spin" />{agentActive ? 'Agent is analyzing…' : 'Preparing…'}</> : <>Analyze requirements <span aria-hidden="true">→</span></>}</button><p className="mt-4 text-[11px] leading-5 text-primary-foreground/65">The analysis will clearly label inferred findings and unresolved questions for human review.</p></div></div>
    </div>
  </section>
}

function Field({ label, value, placeholder, onChange, required }: { label: string; value: string; placeholder: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em]">{label}{required && <span className="ml-1 text-destructive">*</span>}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
}

function FileRow({ entry, onRemove }: { entry: FileState; onRemove: () => void }) {
  const statusLabel = entry.status === 'uploaded' ? 'Uploaded' : entry.status === 'uploading' ? 'Uploading' : entry.status === 'failed' ? 'Failed' : formatBytes(entry.file.size)
  return <div className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-background px-3 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-muted"><FileText className="h-4 w-4 text-muted-foreground" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{entry.file.name}</p><p className={`mt-1 text-[10px] ${entry.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}>{statusLabel}{entry.message ? ` · ${entry.message}` : ''}</p></div>{entry.status === 'uploading' ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : entry.status === 'uploaded' ? <Check className="h-4 w-4 text-emerald-600" /> : <button type="button" onClick={onRemove} aria-label={`Remove ${entry.file.name}`} className="grid min-h-9 min-w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Trash2 className="h-4 w-4" /></button>}</div>
}

function ReadinessRow({ label, value, ready }: { label: string; value: string; ready: boolean }) {
  return <div className="flex items-center justify-between gap-4 border-b border-primary-foreground/20 py-3 text-xs"><span>{label}</span><span className={`font-semibold ${ready ? 'text-primary-foreground' : 'text-primary-foreground/60'}`}>{value}</span></div>
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
