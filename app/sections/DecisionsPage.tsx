'use client'

import React, { useState } from 'react'
import { BookMarked, Search, Check, X, RefreshCw } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface DecisionItem      { _id?: string; decision_text: string; decided_date: string; feature_area: string; confidence?: string; branch_id?: string }
interface ExtractedDecision { decision_text?: string; decided_date?: string; feature_area?: string; confidence?: string }

interface DecisionsPageProps {
  decisions:           DecisionItem[]
  extractedDecisions:  ExtractedDecision[]
  extractionLoading:   boolean
  extractionSummary:   string
  activeAgentId:       string | null
  onExtractDecisions:  (notes: string) => void
  onSaveDecision:      (d: ExtractedDecision) => void
  onDismissExtracted:  (index: number) => void
  onRefreshDecisions:  () => void
  showSample:          boolean
}

function confidenceChip(c?: string) {
  const v = (c ?? '').toLowerCase()
  if (v.includes('high'))   return 'safe-chip'
  if (v.includes('medium')) return 'pending-chip'
  return 'chip bg-muted text-muted-foreground border-border'
}

export default function DecisionsPage({
  decisions, extractedDecisions, extractionLoading, extractionSummary,
  activeAgentId, onExtractDecisions, onSaveDecision, onDismissExtracted, onRefreshDecisions,
}: DecisionsPageProps) {
  const [search,      setSearch]      = useState('')
  const [areaFilter,  setAreaFilter]  = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')

  const filtered = decisions.filter((d) => {
    const matchSearch = !search || d.decision_text.toLowerCase().includes(search.toLowerCase())
    const matchArea   = !areaFilter || d.feature_area.toLowerCase().includes(areaFilter.toLowerCase())
    return matchSearch && matchArea
  })

  const featureAreas = Array.from(new Set(decisions.map((d) => d.feature_area).filter(Boolean)))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Decision Log</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">Architectural decisions, extracted from meeting notes and searchable forever.</p>
        </div>
        <button onClick={onRefreshDecisions} className="btn-ghost h-8 px-3 text-[12.5px] flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Extract from notes */}
      <div className="blade p-4 space-y-3">
        <div>
          <p className="text-[13.5px] font-semibold text-foreground">Extract Decisions from Notes</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Paste any standup summary, meeting transcript, or notes.</p>
        </div>
        <Textarea
          placeholder="We decided to use JWT with 7-day refresh tokens. The payment module will not handle refunds in v1…"
          value={meetingNotes}
          onChange={(e) => setMeetingNotes(e.target.value)}
          rows={5}
          className="relay-input resize-none"
        />
        <button
          onClick={() => { onExtractDecisions(meetingNotes); setMeetingNotes('') }}
          disabled={extractionLoading || !meetingNotes.trim()}
          className="btn-primary h-8 px-3 text-[12.5px] disabled:opacity-50 flex items-center gap-1.5"
        >
          {extractionLoading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Extracting…</>
          ) : (
            <><BookMarked className="h-3.5 w-3.5" />Extract Decisions</>
          )}
        </button>
        {extractionSummary && (
          <p className="text-[12px] text-muted-foreground">{extractionSummary}</p>
        )}
      </div>

      {/* Extracted — pending save */}
      {extractedDecisions.length > 0 && (
        <div className="space-y-2">
          <p className="section-label px-1">Extracted — Review & Save</p>
          {extractedDecisions.map((d, i) => (
            <div key={i} className="blade p-3 flex items-start gap-3 border-l-2 border-l-primary">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground leading-snug">{d.decision_text ?? 'No text'}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground">{d.decided_date ?? '—'}</span>
                  {d.feature_area && <span className="chip bg-muted text-muted-foreground border-border">{d.feature_area}</span>}
                  {d.confidence   && <span className={confidenceChip(d.confidence)}>{d.confidence}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onSaveDecision(d)} className="h-7 w-7 grid place-items-center rounded-md text-safe hover:bg-safe/10 transition-colors"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={() => onDismissExtracted(i)} className="h-7 w-7 grid place-items-center rounded-md text-conflict hover:bg-conflict/10 transition-colors"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decision history */}
      <div className="blade">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-semibold text-foreground">Recent Decisions ({decisions.length})</p>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search decisions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="relay-input pl-8 h-8 text-[12.5px]"
              />
            </div>
            {featureAreas.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setAreaFilter('')} className={`text-[11.5px] h-7 px-2.5 rounded-lg border transition-colors ${areaFilter === '' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>All</button>
                {featureAreas.slice(0, 5).map((a) => (
                  <button key={a} onClick={() => setAreaFilter(a === areaFilter ? '' : a)} className={`text-[11.5px] h-7 px-2.5 rounded-lg border transition-colors ${areaFilter === a ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>{a}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <BookMarked className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[13px] text-muted-foreground">No decisions yet. Extract some from your meeting notes above.</p>
            </div>
          ) : (
            filtered.map((d, i) => (
              <div key={d._id ?? i} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                <p className="text-[13px] text-foreground leading-snug">{d.decision_text}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground">{d.decided_date}</span>
                  {d.feature_area && <span className="chip bg-muted text-muted-foreground border-border">{d.feature_area}</span>}
                  {d.confidence   && <span className={confidenceChip(d.confidence)}>{d.confidence}</span>}
                  {d.branch_id    && <span className="chip bg-primary/8 text-primary border-primary/20">branch-linked</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
