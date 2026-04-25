'use client'

import React, { useState } from 'react'
import { GitPullRequest, ChevronRight, ExternalLink } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

interface PRReviewResult { summary?: string; key_changes?: string[]; potential_issues?: string[]; team_context?: string; recommendation?: string }

interface PullRequestsPageProps {
  prReviewResult:  PRReviewResult | null
  prReviewLoading: boolean
  activeAgentId:   string | null
  onReviewPR:      (title: string, description: string, teamContext: string) => void
  showSample:      boolean
}

interface MockPR { id: number; title: string; author: string; branch: string; filesChanged: number; additions: number; deletions: number; age: string; description: string }

const samplePRs: MockPR[] = [
  { id: 47, title: 'feat: Add OAuth2 PKCE auth flow', author: 'alicechen', branch: 'feature/auth-rework', filesChanged: 12, additions: 450, deletions: 120, age: '2h ago', description: 'Implements PKCE flow for OAuth2 authentication. Replaces legacy token-based auth.' },
  { id: 46, title: 'fix: Rate limit middleware edge cases', author: 'davewu', branch: 'fix/api-validation', filesChanged: 4, additions: 85, deletions: 30, age: '5h ago', description: 'Fixes concurrent request bypass during sliding window calculation.' },
  { id: 45, title: 'feat: User profile avatar upload', author: 'bobpark', branch: 'feature/user-profile', filesChanged: 8, additions: 220, deletions: 45, age: '1d ago', description: 'Adds avatar upload with JPEG, PNG, WebP support and CDN integration.' },
]

export default function PullRequestsPage({ prReviewResult, prReviewLoading, activeAgentId, onReviewPR, showSample }: PullRequestsPageProps) {
  const [selectedPR,   setSelectedPR]   = useState<MockPR | null>(null)
  const [customTitle,  setCustomTitle]  = useState('')
  const [customDesc,   setCustomDesc]   = useState('')
  const [customCtx,    setCustomCtx]    = useState('')

  const displayPRs = showSample ? samplePRs : []

  const handleReviewSelected = () => {
    if (!selectedPR) return
    onReviewPR(selectedPR.title, selectedPR.description, 'Team context: teammates are working on related branches.')
  }

  const handleReviewCustom = () => {
    if (!customTitle.trim() || !customDesc.trim()) return
    onReviewPR(customTitle, customDesc, customCtx || 'No additional context.')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">Pull Requests</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">AI-powered code review with team context awareness. Open a branch session to review a PR inline.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: PR list + custom form */}
        <div className="lg:col-span-2 space-y-3">
          <div className="blade">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <GitPullRequest className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[13px] font-semibold text-foreground">Open PRs</span>
            </div>
            <div className="divide-y divide-border">
              {displayPRs.length === 0 ? (
                <div className="p-6 text-center">
                  <GitPullRequest className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[12.5px] text-muted-foreground">Connect a GitHub repo and sync branches. PRs from branches with open PRs appear here automatically.</p>
                  <p className="text-[11.5px] text-muted-foreground mt-1">Or use the custom review form below.</p>
                </div>
              ) : (
                displayPRs.map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => setSelectedPR(pr)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-start gap-3 ${selectedPR?.id === pr.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-mono text-muted-foreground">#{pr.id}</span>
                        <span className="safe-chip">open</span>
                      </div>
                      <p className="text-[12.5px] font-medium text-foreground leading-snug truncate">{pr.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span>@{pr.author}</span>
                        <span>·</span>
                        <span className="text-safe">+{pr.additions}</span>
                        <span className="text-conflict">-{pr.deletions}</span>
                        <span className="ml-auto">{pr.age}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </button>
                ))
              )}
            </div>
            {selectedPR && (
              <div className="p-3 border-t border-border">
                <button
                  onClick={handleReviewSelected}
                  disabled={prReviewLoading}
                  className="btn-primary w-full h-8 text-[12.5px] disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {prReviewLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Reviewing…</> : 'Review with AI'}
                </button>
              </div>
            )}
          </div>

          {/* Custom review form */}
          <div className="blade p-4 space-y-3">
            <p className="text-[13px] font-semibold text-foreground">Custom PR Review</p>
            <Input
              placeholder="PR Title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="relay-input h-8 text-[12.5px]"
            />
            <Textarea
              placeholder="PR Description / Changes…"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              rows={3}
              className="relay-input resize-none"
            />
            <Textarea
              placeholder="Team context (optional)"
              value={customCtx}
              onChange={(e) => setCustomCtx(e.target.value)}
              rows={2}
              className="relay-input resize-none"
            />
            <button
              onClick={handleReviewCustom}
              disabled={prReviewLoading || !customTitle.trim() || !customDesc.trim()}
              className="btn-primary w-full h-8 text-[12.5px] disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {prReviewLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Reviewing…</> : 'Review This PR'}
            </button>
          </div>
        </div>

        {/* Right: Review result */}
        <div className="lg:col-span-3">
          <div className="blade h-full">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[13px] font-semibold text-foreground">Review Summary</p>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
              {!prReviewResult && !prReviewLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GitPullRequest className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-[13px] text-muted-foreground">Select a PR and click &quot;Review with AI&quot; to get a context-aware review.</p>
                  <p className="text-[12px] text-muted-foreground mt-1">The review will include what your teammates are working on.</p>
                </div>
              ) : prReviewLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                  <p className="text-[12.5px] text-muted-foreground">Generating review with team context…</p>
                </div>
              ) : prReviewResult ? (
                <div className="space-y-4">
                  {prReviewResult.summary && (
                    <div>
                      <p className="section-label mb-2">Summary</p>
                      <p className="text-[13px] text-foreground leading-relaxed">{prReviewResult.summary}</p>
                    </div>
                  )}
                  {Array.isArray(prReviewResult.key_changes) && prReviewResult.key_changes.length > 0 && (
                    <div>
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
                    <div>
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
                    <div>
                      <p className="section-label mb-2">Team Context</p>
                      <p className="text-[12.5px] text-muted-foreground leading-relaxed">{prReviewResult.team_context}</p>
                    </div>
                  )}
                  {prReviewResult.recommendation && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="section-label mb-2 text-primary">Recommendation</p>
                      <p className="text-[13px] text-foreground leading-relaxed">{prReviewResult.recommendation}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
