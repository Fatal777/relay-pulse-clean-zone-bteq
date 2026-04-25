'use client'

import React, { useState } from 'react'
import {
  GitBranch, GitPullRequest, BookMarked, AlertTriangle, CheckCircle,
  ExternalLink, Users, ArrowRightCircle, Loader2, FileText, Check, X, Search
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { BranchSession } from './BranchSidebar'

// ─── Types ────────────────────────────────────────────────────────────────────
interface DecisionItem      { _id?: string; decision_text: string; decided_date: string; feature_area: string; confidence?: string; branch_id?: string }
interface ExtractedDecision { decision_text?: string; decided_date?: string; feature_area?: string; confidence?: string }
interface ConflictItem      { branch_a?: string; branch_b?: string; overlapping_files?: string[]; severity?: string; recommendation?: string }
interface ConflictResult    { conflicts?: ConflictItem[]; overall_risk?: string; summary?: string }
interface PRReviewResult    { summary?: string; key_changes?: string[]; potential_issues?: string[]; team_context?: string; recommendation?: string }
interface TeamMember        { _id?: string; name: string; github_username: string; role?: string }

interface BranchViewProps {
  branch:              BranchSession
  branchDecisions:     DecisionItem[]
  allDecisions:        DecisionItem[]
  extractedDecisions:  ExtractedDecision[]
  extractionLoading:   boolean
  extractionSummary:   string
  conflictResult:      ConflictResult | null
  conflictLoading:     boolean
  prReviewResult:      PRReviewResult | null
  prReviewLoading:     boolean
  activeAgentId:       string | null
  conflictAgentId:     string
  prReviewAgentId:     string
  decisionAgentId:     string
  teamMembers:         TeamMember[]
  repoOwner:           string
  repoName:            string
  githubToken:         string
  onAnalyzeConflicts:  () => void
  onReviewPR:          (title: string, description: string, teamContext: string) => void
  onExtractDecisions:  (notes: string) => void
  onSaveDecision:      (d: ExtractedDecision) => void
  onDismissExtracted:  (index: number) => void
  onHandoff:           () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const KIND_CHIP: Record<string, string> = {
  feature:  'chip-feature',
  fix:      'chip-fix',
  chore:    'chip-chore',
  refactor: 'chip-refactor',
}
const STATUS_CHIP: Record<string, string> = {
  active:    'chip bg-primary/10 text-primary border-primary/20',
  review:    'pending-chip',
  merged:    'safe-chip',
  abandoned: 'chip bg-muted text-muted-foreground border-border',
}

function severityBadge(s?: string) {
  const v = (s ?? '').toLowerCase()
  if (v.includes('high') || v.includes('critical')) return 'conflict-chip'
  if (v.includes('medium')) return 'pending-chip'
  return 'safe-chip'
}

function confidenceBadge(c?: string) {
  const v = (c ?? '').toLowerCase()
  if (v.includes('high'))   return 'safe-chip'
  if (v.includes('medium')) return 'pending-chip'
  return 'chip bg-muted text-muted-foreground border-border'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilesTab({ branch }: { branch: BranchSession }) {
  const files = (branch as any).changed_files as string[] | undefined ?? []
  return (
    <div>
      {files.length === 0 ? (
        <div className="blade p-8 text-center">
          <GitBranch className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[13px] text-muted-foreground">No changed files — sync from GitHub to populate.</p>
        </div>
      ) : (
        <div className="blade">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="section-label">Changed Files vs. main</p>
            <span className="text-[11.5px] text-muted-foreground">{files.length} files</span>
          </div>
          <div className="divide-y divide-border">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="filepath flex-1">{file}</span>
                {branch.hasConflict && (
                  <span className="conflict-chip text-[10px]">may conflict</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ConflictsTab({
  branch,
  conflictResult,
  conflictLoading,
  activeAgentId,
  conflictAgentId,
  onAnalyzeConflicts,
}: {
  branch: BranchSession
  conflictResult: ConflictResult | null
  conflictLoading: boolean
  activeAgentId: string | null
  conflictAgentId: string
  onAnalyzeConflicts: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13.5px] font-medium text-foreground">Conflict Analysis</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Detect files this branch shares with other active branches.
          </p>
        </div>
        <button
          onClick={onAnalyzeConflicts}
          disabled={conflictLoading}
          className="btn-primary h-8 px-3 text-[12.5px] disabled:opacity-50 flex items-center gap-1.5"
        >
          {conflictLoading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyzing…</>
          ) : (
            <><AlertTriangle className="h-3.5 w-3.5" />Run Analysis</>
          )}
        </button>
      </div>

      {!conflictResult && !conflictLoading && (
        <div className="blade p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[13px] text-muted-foreground">
            {branch.hasConflict
              ? 'Conflicts detected in last sync. Click Run Analysis for details.'
              : 'No conflicts detected in last sync. Click Run Analysis to verify.'}
          </p>
        </div>
      )}

      {conflictResult && (
        <div className="space-y-3">
          {/* Overall risk */}
          {conflictResult.overall_risk && (
            <div className="blade p-4 flex items-center gap-3">
              <span className="text-[12.5px] text-muted-foreground">Overall Risk</span>
              <span className={severityBadge(conflictResult.overall_risk)}>
                {conflictResult.overall_risk}
              </span>
              {conflictResult.summary && (
                <p className="text-[12.5px] text-muted-foreground ml-auto max-w-sm text-right truncate">
                  {conflictResult.summary}
                </p>
              )}
            </div>
          )}

          {/* Conflict items */}
          {Array.isArray(conflictResult.conflicts) && conflictResult.conflicts.length > 0 ? (
            <div className="space-y-2">
              {conflictResult.conflicts.map((c, i) => (
                <div key={i} className="blade p-4 border-l-2 border-l-[hsl(var(--conflict))]">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="filepath">{c?.branch_a ?? '?'}</span>
                    <span className="text-[11.5px] text-muted-foreground">↔</span>
                    <span className="filepath">{c?.branch_b ?? '?'}</span>
                    <span className={`ml-auto ${severityBadge(c?.severity)}`}>{c?.severity ?? 'unknown'}</span>
                  </div>
                  {Array.isArray(c?.overlapping_files) && c.overlapping_files.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {c.overlapping_files.map((f, j) => (
                        <span key={j} className="filepath">{f}</span>
                      ))}
                    </div>
                  )}
                  {c?.recommendation && (
                    <p className="text-[12px] text-muted-foreground">{c.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="blade p-6 flex items-center gap-3 text-safe">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <p className="text-[13px] font-medium">No conflicts detected with other active branches.</p>
            </div>
          )}
        </div>
      )}

      {activeAgentId === conflictAgentId && (
        <p className="text-[11.5px] text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Conflict Analysis Agent processing…
        </p>
      )}
    </div>
  )
}

function DecisionsTab({
  branch,
  branchDecisions,
  extractedDecisions,
  extractionLoading,
  extractionSummary,
  activeAgentId,
  decisionAgentId,
  onExtractDecisions,
  onSaveDecision,
  onDismissExtracted,
}: {
  branch: BranchSession
  branchDecisions: DecisionItem[]
  extractedDecisions: ExtractedDecision[]
  extractionLoading: boolean
  extractionSummary: string
  activeAgentId: string | null
  decisionAgentId: string
  onExtractDecisions: (notes: string) => void
  onSaveDecision: (d: ExtractedDecision) => void
  onDismissExtracted: (i: number) => void
}) {
  const [notes, setNotes] = useState('')

  return (
    <div className="space-y-5">
      {/* Extract from notes */}
      <div className="blade p-4 space-y-3">
        <div>
          <p className="text-[13.5px] font-medium text-foreground">Extract from Meeting Notes</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Decisions saved here are linked to this branch session.
          </p>
        </div>
        <Textarea
          placeholder="Paste standup notes, meeting transcript, or any text…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="relay-input resize-none"
        />
        <button
          onClick={() => { onExtractDecisions(notes); setNotes('') }}
          disabled={extractionLoading || !notes.trim()}
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

      {/* Extracted (pending save) */}
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
                  {d.confidence   && <span className={confidenceBadge(d.confidence)}>{d.confidence}</span>}
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

      {/* Saved decisions for this branch */}
      <div>
        <p className="section-label px-1 mb-2">
          Saved for {branch.branch_name} ({branchDecisions.length})
        </p>
        {branchDecisions.length === 0 ? (
          <div className="blade p-6 text-center">
            <BookMarked className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[12.5px] text-muted-foreground">No decisions linked to this branch yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {branchDecisions.map((d, i) => (
              <div key={d._id ?? i} className="blade p-3 hover:shadow-pop transition-shadow">
                <p className="text-[13px] text-foreground leading-snug">{d.decision_text}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground">{d.decided_date}</span>
                  {d.feature_area && <span className="chip bg-muted text-muted-foreground border-border">{d.feature_area}</span>}
                  {d.confidence   && <span className={confidenceBadge(d.confidence)}>{d.confidence}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PRReviewTab({
  branch,
  prReviewResult,
  prReviewLoading,
  activeAgentId,
  prReviewAgentId,
  teamMembers,
  repoOwner,
  repoName,
  onReviewPR,
}: {
  branch: BranchSession
  prReviewResult: PRReviewResult | null
  prReviewLoading: boolean
  activeAgentId: string | null
  prReviewAgentId: string
  teamMembers: TeamMember[]
  repoOwner: string
  repoName: string
  onReviewPR: (title: string, description: string, teamContext: string) => void
}) {
  const hasPR = !!(branch as any).pr_number

  const generateReview = () => {
    const prTitle   = (branch as any).pr_title   ?? `PR for ${branch.branch_name}`
    const prDesc    = `Branch ${branch.branch_name} with ${((branch as any).changed_files as string[] ?? []).length} changed files.`
    const teamCtx   = teamMembers.map((m) => `${m.name} (@${m.github_username})`).join(', ')
    onReviewPR(prTitle, prDesc, `Team: ${teamCtx}. Repo: ${repoOwner}/${repoName}.`)
  }

  return (
    <div className="space-y-4">
      {/* PR header */}
      <div className="blade p-4">
        {hasPR ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GitPullRequest className="h-4 w-4 text-safe" />
                <span className="safe-chip">open</span>
                <span className="text-[12px] text-muted-foreground font-mono">#{(branch as any).pr_number}</span>
              </div>
              <p className="text-[13.5px] font-medium text-foreground">{(branch as any).pr_title}</p>
            </div>
            {(branch as any).pr_url && (
              <a
                href={(branch as any).pr_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline h-7 px-3 text-[12px] flex items-center gap-1.5 shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
                Open on GitHub
              </a>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <GitPullRequest className="h-8 w-8 text-muted-foreground/30" />
            <div>
              <p className="text-[13px] text-muted-foreground">No open PR detected for this branch.</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Open a PR on GitHub, then sync branches to detect it.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Generate review CTA */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13.5px] font-medium text-foreground">AI Review with Team Context</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Generates a review aware of what your teammates are working on.
          </p>
        </div>
        <button
          onClick={generateReview}
          disabled={prReviewLoading}
          className="btn-primary h-8 px-3 text-[12.5px] disabled:opacity-50 flex items-center gap-1.5"
        >
          {prReviewLoading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Reviewing…</>
          ) : (
            <><GitPullRequest className="h-3.5 w-3.5" />Review with AI</>
          )}
        </button>
      </div>

      {/* Review result */}
      {prReviewResult && (
        <div className="space-y-3">
          {prReviewResult.summary && (
            <div className="blade p-4">
              <p className="section-label mb-2">Summary</p>
              <p className="text-[13px] text-foreground leading-relaxed">{prReviewResult.summary}</p>
            </div>
          )}

          {Array.isArray(prReviewResult.key_changes) && prReviewResult.key_changes.length > 0 && (
            <div className="blade p-4">
              <p className="section-label mb-2">Key Changes</p>
              <ul className="space-y-1.5">
                {prReviewResult.key_changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-[6px] shrink-0" />
                    <p className="text-[12.5px] text-foreground/80">{c}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(prReviewResult.potential_issues) && prReviewResult.potential_issues.length > 0 && (
            <div className="blade p-4 border-l-2 border-l-[hsl(var(--pending))]">
              <p className="section-label mb-2 text-[hsl(var(--pending))]">Potential Issues</p>
              <ul className="space-y-1.5">
                {prReviewResult.potential_issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--pending))] mt-[6px] shrink-0" />
                    <p className="text-[12.5px] text-foreground/80">{issue}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prReviewResult.team_context && (
            <div className="blade p-4">
              <p className="section-label mb-2">Team Context</p>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">{prReviewResult.team_context}</p>
            </div>
          )}

          {prReviewResult.recommendation && (
            <div className="blade p-4 bg-primary/5 border-primary/20">
              <p className="section-label mb-2 text-primary">Recommendation</p>
              <p className="text-[13px] text-foreground leading-relaxed">{prReviewResult.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {activeAgentId === prReviewAgentId && !prReviewResult && (
        <p className="text-[11.5px] text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          PR Review Agent processing…
        </p>
      )}
    </div>
  )
}

// ─── BranchView Root ──────────────────────────────────────────────────────────
export default function BranchView({
  branch,
  branchDecisions,
  allDecisions,
  extractedDecisions,
  extractionLoading,
  extractionSummary,
  conflictResult,
  conflictLoading,
  prReviewResult,
  prReviewLoading,
  activeAgentId,
  conflictAgentId,
  prReviewAgentId,
  decisionAgentId,
  teamMembers,
  repoOwner,
  repoName,
  githubToken,
  onAnalyzeConflicts,
  onReviewPR,
  onExtractDecisions,
  onSaveDecision,
  onDismissExtracted,
  onHandoff,
}: BranchViewProps) {
  const files = (branch as any).changed_files as string[] ?? []

  return (
    <div className="space-y-4">
      {/* ── Branch Header ── */}
      <div className="blade p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground mb-1.5">
              <span className="font-mono">{repoOwner}/{repoName}</span>
              <span>/</span>
              <span className="font-mono text-foreground font-medium">{branch.branch_name}</span>
            </div>

            {/* Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={KIND_CHIP[branch.kind] ?? 'chip'}>
                {branch.kind.charAt(0).toUpperCase() + branch.kind.slice(1)}
              </span>
              <span className={STATUS_CHIP[branch.status] ?? 'chip'}>
                {branch.status === 'review' ? 'In Review' : branch.status.charAt(0).toUpperCase() + branch.status.slice(1)}
              </span>
              {branch.hasConflict && (
                <span className="conflict-chip flex items-center gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Has Conflicts
                </span>
              )}
              {files.length > 0 && (
                <span className="chip bg-muted text-muted-foreground border-border">
                  {files.length} files changed
                </span>
              )}
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">
                {(branch.github_author ?? '?')[0]?.toUpperCase()}
              </div>
              <span className="text-[12px] text-muted-foreground">{branch.github_author}</span>
              {(branch.collaborator_user_ids?.length ?? 0) > 0 && (
                <span className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  +{branch.collaborator_user_ids!.length} collaborator{branch.collaborator_user_ids!.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {branch.status === 'active' && (
              <button
                onClick={onHandoff}
                className="btn-outline h-8 px-3 text-[12.5px] flex items-center gap-1.5"
                title="Mark as Ready for Review"
              >
                <ArrowRightCircle className="h-3.5 w-3.5" />
                Mark for Review
              </button>
            )}
            {(branch as any).pr_url && (
              <a
                href={(branch as any).pr_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost h-8 px-3 text-[12.5px] flex items-center gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Workspace Tabs ── */}
      <Tabs defaultValue="files">
        <TabsList className="bg-muted h-9">
          <TabsTrigger value="files"     className="text-[12.5px] data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Files {files.length > 0 && <span className="ml-1.5 text-[10px] text-muted-foreground">{files.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="text-[12.5px] data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Conflicts {branch.hasConflict && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-conflict inline-block" />}
          </TabsTrigger>
          <TabsTrigger value="decisions" className="text-[12.5px] data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Decisions {branchDecisions.length > 0 && <span className="ml-1.5 text-[10px] text-muted-foreground">{branchDecisions.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="pr-review" className="text-[12.5px] data-[state=active]:bg-card data-[state=active]:shadow-sm">
            PR Review {(branch as any).pr_number && <span className="ml-1.5 text-[10px] text-muted-foreground">#{(branch as any).pr_number}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files"     className="mt-4"><FilesTab branch={branch} /></TabsContent>
        <TabsContent value="conflicts" className="mt-4">
          <ConflictsTab
            branch={branch}
            conflictResult={conflictResult}
            conflictLoading={conflictLoading}
            activeAgentId={activeAgentId}
            conflictAgentId={conflictAgentId}
            onAnalyzeConflicts={onAnalyzeConflicts}
          />
        </TabsContent>
        <TabsContent value="decisions" className="mt-4">
          <DecisionsTab
            branch={branch}
            branchDecisions={branchDecisions}
            extractedDecisions={extractedDecisions}
            extractionLoading={extractionLoading}
            extractionSummary={extractionSummary}
            activeAgentId={activeAgentId}
            decisionAgentId={decisionAgentId}
            onExtractDecisions={onExtractDecisions}
            onSaveDecision={onSaveDecision}
            onDismissExtracted={onDismissExtracted}
          />
        </TabsContent>
        <TabsContent value="pr-review" className="mt-4">
          <PRReviewTab
            branch={branch}
            prReviewResult={prReviewResult}
            prReviewLoading={prReviewLoading}
            activeAgentId={activeAgentId}
            prReviewAgentId={prReviewAgentId}
            teamMembers={teamMembers}
            repoOwner={repoOwner}
            repoName={repoName}
            onReviewPR={onReviewPR}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
