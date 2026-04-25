'use client'

import React from 'react'
import { AlertTriangle, GitBranch, Activity, Users, RefreshCw, CheckCircle } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import type { BranchSession } from './BranchSidebar'

interface ConflictItem   { branch_a?: string; branch_b?: string; overlapping_files?: string[]; severity?: string; recommendation?: string }
interface ConflictResult { conflicts?: ConflictItem[]; overall_risk?: string; summary?: string }
interface TeamMember     { _id?: string; name: string; github_username: string; role?: string }

interface HomePageProps {
  teamMembers:       TeamMember[]
  branches:          BranchSession[]
  repoOwner:         string
  repoName:          string
  conflictResult:    ConflictResult | null
  conflictLoading:   boolean
  activeAgentId:     string | null
  onAnalyzeConflicts: () => void
  onSelectBranch:    (id: string) => void
  showSample:        boolean
}

function severityChip(s?: string) {
  const v = (s ?? '').toLowerCase()
  if (v.includes('high') || v.includes('critical')) return 'conflict-chip'
  if (v.includes('medium')) return 'pending-chip'
  return 'safe-chip'
}

export default function HomePage({
  teamMembers, branches, repoOwner, repoName,
  conflictResult, conflictLoading, activeAgentId,
  onAnalyzeConflicts, onSelectBranch,
}: HomePageProps) {
  const conflictingBranches = branches.filter((b) => b.hasConflict)
  const activeBranches      = branches.filter((b) => b.status === 'active' || b.status === 'review')

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">Overview</h1>
          {repoOwner && repoName ? (
            <p className="text-[12.5px] text-muted-foreground mt-0.5 font-mono">{repoOwner}/{repoName}</p>
          ) : (
            <p className="text-[12.5px] text-muted-foreground mt-0.5">Connect your repo in Settings to see live data.</p>
          )}
        </div>
        <button
          onClick={onAnalyzeConflicts}
          disabled={conflictLoading}
          className="btn-outline h-8 px-3 text-[12.5px] flex items-center gap-1.5 disabled:opacity-50"
        >
          {conflictLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Analyze Conflicts
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Branches', value: activeBranches.length, icon: GitBranch, color: 'text-primary' },
          { label: 'With Conflicts',  value: conflictingBranches.length, icon: AlertTriangle, color: conflictingBranches.length > 0 ? 'text-conflict' : 'text-safe' },
          { label: 'Team Members',    value: teamMembers.length, icon: Users, color: 'text-muted-foreground' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="blade p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="section-label">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Who's working on what */}
        <div className="blade">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[13px] font-semibold text-foreground">Who&apos;s Working on What</span>
          </div>
          <div className="divide-y divide-border">
            {activeBranches.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[12.5px] text-muted-foreground">No active branches. Sync from GitHub to see who&apos;s working on what.</p>
              </div>
            ) : (
              activeBranches.slice(0, 8).map((b) => (
                <button
                  key={b._id}
                  onClick={() => onSelectBranch(b._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left group"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                    {(b.github_author ?? '?')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-foreground truncate">{b.github_author}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{b.branch_name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {b.hasConflict && <AlertTriangle className="h-3.5 w-3.5 text-conflict" />}
                    <span className={`chip-${b.kind}`}>{b.kind}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conflict Radar */}
        <div className="blade">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[13px] font-semibold text-foreground">Conflict Radar</span>
            </div>
            {conflictResult?.overall_risk && (
              <span className={severityChip(conflictResult.overall_risk)}>
                {conflictResult.overall_risk} risk
              </span>
            )}
          </div>
          <div className="p-4">
            {!conflictResult && !conflictLoading ? (
              <div className="text-center py-6">
                {conflictingBranches.length > 0 ? (
                  <>
                    <AlertTriangle className="h-7 w-7 text-conflict mx-auto mb-2" />
                    <p className="text-[12.5px] text-conflict font-medium">{conflictingBranches.length} branch{conflictingBranches.length !== 1 ? 'es have' : ' has'} potential conflicts</p>
                    <p className="text-[12px] text-muted-foreground mt-1">Click &quot;Analyze Conflicts&quot; for details.</p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-7 w-7 text-safe mx-auto mb-2" />
                    <p className="text-[12.5px] text-safe font-medium">No conflicts detected</p>
                    <p className="text-[12px] text-muted-foreground mt-1">All branches are clear.</p>
                  </>
                )}
              </div>
            ) : conflictLoading ? (
              <div className="text-center py-6">
                <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
                <p className="text-[12.5px] text-muted-foreground">Analyzing active branches…</p>
              </div>
            ) : conflictResult ? (
              <div className="space-y-3">
                {conflictResult.summary && (
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">{conflictResult.summary}</p>
                )}
                {Array.isArray(conflictResult.conflicts) && conflictResult.conflicts.length > 0 ? (
                  <div className="space-y-2">
                    {conflictResult.conflicts.slice(0, 3).map((c, i) => (
                      <div key={i} className="rounded-lg border border-conflict/20 bg-conflict/5 p-3">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="filepath">{c?.branch_a ?? '?'}</span>
                          <span className="text-[11px] text-muted-foreground">↔</span>
                          <span className="filepath">{c?.branch_b ?? '?'}</span>
                          <span className={`ml-auto ${severityChip(c?.severity)}`}>{c?.severity}</span>
                        </div>
                        {Array.isArray(c?.overlapping_files) && (
                          <div className="flex flex-wrap gap-1">
                            {c.overlapping_files.slice(0, 3).map((f, j) => (
                              <span key={j} className="filepath text-[10.5px]">{f}</span>
                            ))}
                            {c.overlapping_files.length > 3 && (
                              <span className="text-[10.5px] text-muted-foreground">+{c.overlapping_files.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-safe">
                    <CheckCircle className="h-4 w-4" />
                    <p className="text-[12.5px]">No conflicts found across active branches.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Team members */}
      {teamMembers.length > 0 && (
        <div className="blade">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-[13px] font-semibold text-foreground">Team</span>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {teamMembers.map((m, i) => (
              <div key={m._id ?? i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">
                  {(m.name ?? '?')[0]?.toUpperCase()}
                </div>
                <span className="text-[12px] text-foreground font-medium">{m.name}</span>
                <span className="text-[11px] text-muted-foreground font-mono">@{m.github_username}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
