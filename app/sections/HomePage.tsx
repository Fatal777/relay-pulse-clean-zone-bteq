'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, AlertTriangle, GitBranch, Activity, User, Loader2 } from 'lucide-react'

interface ConflictItem {
  branch_a?: string
  branch_b?: string
  overlapping_files?: string[]
  severity?: string
  recommendation?: string
}

interface ConflictResult {
  conflicts?: ConflictItem[]
  overall_risk?: string
  summary?: string
}

interface TeamMember {
  _id?: string
  name: string
  github_username: string
  role?: string
}

interface HomePageProps {
  teamMembers: TeamMember[]
  repoOwner: string
  repoName: string
  conflictResult: ConflictResult | null
  conflictLoading: boolean
  activeAgentId: string | null
  onAnalyzeConflicts: () => void
  showSample: boolean
}

const sampleConflicts: ConflictResult = {
  conflicts: [
    { branch_a: 'feature/auth-redesign', branch_b: 'feature/user-profile', overlapping_files: ['src/components/Auth.tsx', 'src/hooks/useAuth.ts', 'src/utils/session.ts'], severity: 'high', recommendation: 'Coordinate merge order. Auth changes should merge first as they modify shared hooks.' },
    { branch_a: 'fix/api-validation', branch_b: 'feature/new-endpoints', overlapping_files: ['src/api/middleware.ts'], severity: 'medium', recommendation: 'Minor overlap in middleware. Review validation changes before merging endpoints.' },
  ],
  overall_risk: 'Medium-High',
  summary: '2 potential conflicts detected across active branches. The auth-related overlap is the highest priority to resolve.',
}

const sampleActivity = [
  { type: 'commit', user: 'alice', message: 'Fix auth token refresh logic', branch: 'feature/auth-redesign', time: '12 min ago' },
  { type: 'pr', user: 'bob', message: 'Add user profile avatar upload', branch: 'feature/user-profile', time: '45 min ago' },
  { type: 'branch', user: 'carol', message: 'Created branch fix/api-validation', branch: 'fix/api-validation', time: '2 hours ago' },
  { type: 'commit', user: 'dave', message: 'Add rate limiting middleware', branch: 'feature/new-endpoints', time: '3 hours ago' },
]

function severityColor(severity?: string) {
  const s = (severity ?? '').toLowerCase()
  if (s.includes('high') || s.includes('critical')) return 'bg-destructive/20 text-destructive border-destructive/30'
  if (s.includes('medium')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-green-500/20 text-green-400 border-green-500/30'
}

export default function HomePage({ teamMembers, repoOwner, repoName, conflictResult, conflictLoading, activeAgentId, onAnalyzeConflicts, showSample }: HomePageProps) {
  const displayConflicts = showSample ? sampleConflicts : conflictResult
  const displayActivity = showSample ? sampleActivity : []
  const displayMembers = showSample && teamMembers.length === 0
    ? [{ name: 'Alice Chen', github_username: 'alicechen', role: 'lead' }, { name: 'Bob Park', github_username: 'bobpark', role: 'member' }, { name: 'Carol Wu', github_username: 'carolwu', role: 'member' }]
    : teamMembers

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{repoOwner && repoName ? `${repoOwner}/${repoName}` : 'Configure your repo in Settings'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-56">
              {displayActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity. Connect your repo in Settings to see live updates.</p>
              ) : (
                <div className="space-y-3">
                  {displayActivity.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center mt-0.5 shrink-0">
                        {item.type === 'commit' && <Activity className="w-3.5 h-3.5 text-primary" />}
                        {item.type === 'pr' && <GitBranch className="w-3.5 h-3.5 text-green-400" />}
                        {item.type === 'branch' && <GitBranch className="w-3.5 h-3.5 text-yellow-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{item.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.user} on <span className="font-mono text-xs">{item.branch}</span> &middot; {item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Who&apos;s Working on What
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-56">
              {displayMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Add team members in Settings to track their work.</p>
              ) : (
                <div className="space-y-3">
                  {displayMembers.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{(m.name ?? '?')[0]?.toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">@{m.github_username}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{m.role ?? 'member'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Conflict Radar
            </CardTitle>
            <Button size="sm" variant="outline" onClick={onAnalyzeConflicts} disabled={conflictLoading} className="text-xs">
              {conflictLoading ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Analyzing...</> : <><RefreshCw className="w-3 h-3 mr-1.5" />Analyze Conflicts</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!displayConflicts ? (
            <p className="text-sm text-muted-foreground text-center py-8">Click &quot;Analyze Conflicts&quot; to scan active branches for overlapping changes.</p>
          ) : (
            <div className="space-y-4">
              {displayConflicts.overall_risk && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Overall Risk:</span>
                  <Badge className={severityColor(displayConflicts.overall_risk)}>{displayConflicts.overall_risk}</Badge>
                </div>
              )}
              {displayConflicts.summary && <p className="text-sm text-foreground/80">{displayConflicts.summary}</p>}
              <Separator />
              {Array.isArray(displayConflicts.conflicts) && displayConflicts.conflicts.length > 0 ? (
                <div className="space-y-3">
                  {displayConflicts.conflicts.map((c, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border bg-secondary/20">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">{c?.branch_a ?? 'unknown'}</Badge>
                        <span className="text-xs text-muted-foreground">vs</span>
                        <Badge variant="outline" className="font-mono text-xs">{c?.branch_b ?? 'unknown'}</Badge>
                        <Badge className={`ml-auto ${severityColor(c?.severity)}`}>{c?.severity ?? 'unknown'}</Badge>
                      </div>
                      {Array.isArray(c?.overlapping_files) && c.overlapping_files.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1">Overlapping files:</p>
                          <div className="flex flex-wrap gap-1">
                            {c.overlapping_files.map((f, j) => (
                              <span key={j} className="text-xs font-mono bg-secondary/50 px-2 py-0.5 rounded">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {c?.recommendation && <p className="text-xs text-muted-foreground">{c.recommendation}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-green-400 text-center py-4">No conflicts detected.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {activeAgentId && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Conflict Analysis Agent processing...</span>
        </div>
      )}
    </div>
  )
}
