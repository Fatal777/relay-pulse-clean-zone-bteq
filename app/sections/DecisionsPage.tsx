'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { FiSearch, FiFileText, FiCheck, FiX } from 'react-icons/fi'
import { Loader2 } from 'lucide-react'

interface DecisionItem {
  _id?: string
  decision_text: string
  decided_date: string
  feature_area: string
  confidence?: string
  source_notes?: string
}

interface ExtractedDecision {
  decision_text?: string
  decided_date?: string
  feature_area?: string
  confidence?: string
}

interface DecisionsPageProps {
  decisions: DecisionItem[]
  extractedDecisions: ExtractedDecision[]
  extractionLoading: boolean
  extractionSummary: string
  activeAgentId: string | null
  onExtractDecisions: (notes: string) => void
  onSaveDecision: (d: ExtractedDecision) => void
  onDismissExtracted: (index: number) => void
  onRefreshDecisions: () => void
  showSample: boolean
}

const sampleDecisions: DecisionItem[] = [
  { decision_text: 'Migrate auth to OAuth2 with PKCE flow', decided_date: '2026-04-20', feature_area: 'Authentication', confidence: 'high' },
  { decision_text: 'Use PostgreSQL for analytics data warehouse', decided_date: '2026-04-18', feature_area: 'Infrastructure', confidence: 'high' },
  { decision_text: 'Adopt Tailwind CSS v4 for the design system', decided_date: '2026-04-15', feature_area: 'Frontend', confidence: 'medium' },
]

function confidenceColor(c?: string) {
  const val = (c ?? '').toLowerCase()
  if (val.includes('high')) return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (val.includes('medium')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-muted text-muted-foreground border-border'
}

export default function DecisionsPage({ decisions, extractedDecisions, extractionLoading, extractionSummary, activeAgentId, onExtractDecisions, onSaveDecision, onDismissExtracted, onRefreshDecisions, showSample }: DecisionsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [featureFilter, setFeatureFilter] = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')

  const displayDecisions = showSample && decisions.length === 0 ? sampleDecisions : decisions
  const filteredDecisions = displayDecisions.filter((d) => {
    const matchesSearch = !searchQuery || (d.decision_text ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFeature = !featureFilter || (d.feature_area ?? '').toLowerCase().includes(featureFilter.toLowerCase())
    return matchesSearch && matchesFeature
  })

  const featureAreas = Array.from(new Set(displayDecisions.map((d) => d.feature_area).filter(Boolean)))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Decision Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Track architectural decisions and extract new ones from meeting notes.</p>
      </div>

      <Card className="border-border bg-card shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FiFileText className="w-4 h-4 text-primary" />
            Extract Decisions from Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Paste your meeting notes or standup summary here..."
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            rows={5}
            className="bg-input border-border resize-none"
          />
          <Button onClick={() => onExtractDecisions(meetingNotes)} disabled={extractionLoading || !meetingNotes.trim()} className="w-full sm:w-auto">
            {extractionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extracting...</> : 'Extract Decisions'}
          </Button>
          {extractionSummary && <p className="text-sm text-muted-foreground mt-2">{extractionSummary}</p>}
        </CardContent>
      </Card>

      {extractedDecisions.length > 0 && (
        <Card className="border-primary/30 bg-card shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-primary">Extracted Decisions - Review & Save</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {extractedDecisions.map((d, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{d?.decision_text ?? 'No text'}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{d?.decided_date ?? 'No date'}</span>
                      <Badge variant="secondary" className="text-xs">{d?.feature_area ?? 'General'}</Badge>
                      {d?.confidence && <Badge className={`text-xs ${confidenceColor(d.confidence)}`}>{d.confidence}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => onSaveDecision(d)} className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"><FiCheck className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => onDismissExtracted(i)} className="h-8 w-8 p-0 text-destructive hover:text-red-300 hover:bg-destructive/10"><FiX className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold">Decision History</CardTitle>
            <Button size="sm" variant="ghost" onClick={onRefreshDecisions} className="text-xs text-muted-foreground">Refresh</Button>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search decisions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-input border-border" />
            </div>
            {featureAreas.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                <Button size="sm" variant={featureFilter === '' ? 'default' : 'outline'} onClick={() => setFeatureFilter('')} className="text-xs h-8">All</Button>
                {featureAreas.map((area) => (
                  <Button key={area} size="sm" variant={featureFilter === area ? 'default' : 'outline'} onClick={() => setFeatureFilter(area)} className="text-xs h-8">{area}</Button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72">
            {filteredDecisions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No decisions found. Extract some from your meeting notes above.</p>
            ) : (
              <div className="space-y-2">
                {filteredDecisions.map((d, i) => (
                  <div key={d._id ?? i} className="p-3 rounded-xl border border-border hover:border-primary/20 transition-colors">
                    <p className="text-sm font-medium text-foreground">{d.decision_text}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{d.decided_date}</span>
                      <Badge variant="secondary" className="text-xs">{d.feature_area}</Badge>
                      {d.confidence && <Badge className={`text-xs ${confidenceColor(d.confidence)}`}>{d.confidence}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
