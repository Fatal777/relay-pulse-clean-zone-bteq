'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { FiGitPullRequest, FiChevronRight } from 'react-icons/fi'
import { Loader2 } from 'lucide-react'

interface PRReviewResult {
  summary?: string
  key_changes?: string[]
  potential_issues?: string[]
  team_context?: string
  recommendation?: string
}

interface PullRequestsPageProps {
  prReviewResult: PRReviewResult | null
  prReviewLoading: boolean
  activeAgentId: string | null
  onReviewPR: (title: string, description: string, teamContext: string) => void
  showSample: boolean
}

interface MockPR {
  id: number
  title: string
  author: string
  branch: string
  filesChanged: number
  additions: number
  deletions: number
  age: string
  description: string
}

const samplePRs: MockPR[] = [
  { id: 1, title: 'feat: Add OAuth2 PKCE auth flow', author: 'alice', branch: 'feature/auth-redesign', filesChanged: 12, additions: 450, deletions: 120, age: '2 hours ago', description: 'Implements PKCE flow for OAuth2 authentication. Replaces legacy token-based auth with industry-standard PKCE. Adds token refresh, session management, and logout flow.' },
  { id: 2, title: 'fix: Rate limit middleware edge cases', author: 'dave', branch: 'fix/api-validation', filesChanged: 4, additions: 85, deletions: 30, age: '5 hours ago', description: 'Fixes edge cases in rate limiting where concurrent requests from the same IP could bypass limits during the sliding window calculation.' },
  { id: 3, title: 'feat: User profile avatar upload', author: 'bob', branch: 'feature/user-profile', filesChanged: 8, additions: 220, deletions: 45, age: '1 day ago', description: 'Adds avatar upload functionality to user profiles. Supports JPEG, PNG, WebP with automatic resizing and CDN integration.' },
]

const sampleReview: PRReviewResult = {
  summary: 'This PR introduces a complete OAuth2 PKCE authentication flow, replacing the legacy token system. The implementation is well-structured with proper separation of concerns.',
  key_changes: ['New PKCE auth flow implementation in src/auth/', 'Token refresh mechanism with exponential backoff', 'Session management using HTTP-only cookies', 'Updated middleware to support new auth headers'],
  potential_issues: ['The token refresh interval (15min) might be aggressive for low-traffic users', 'Missing rate limiting on the /auth/refresh endpoint', 'No migration path documented for existing sessions'],
  team_context: 'Bob is working on user profiles that depend on the auth system. Merging this first will help avoid conflicts with the profile avatar upload PR.',
  recommendation: 'Approve with minor changes: add rate limiting to /auth/refresh and document the session migration strategy.',
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-2 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm text-foreground/80">{line.slice(2)}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm text-foreground/80">{line}</p>
      })}
    </div>
  )
}

export default function PullRequestsPage({ prReviewResult, prReviewLoading, activeAgentId, onReviewPR, showSample }: PullRequestsPageProps) {
  const [selectedPR, setSelectedPR] = useState<MockPR | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customContext, setCustomContext] = useState('')

  const displayPRs = showSample ? samplePRs : []
  const displayReview = showSample && !prReviewResult ? sampleReview : prReviewResult

  const handleReviewSelected = () => {
    if (selectedPR) {
      onReviewPR(selectedPR.title, selectedPR.description, `Team members working on related branches.`)
    }
  }

  const handleReviewCustom = () => {
    if (customTitle.trim() && customDesc.trim()) {
      onReviewPR(customTitle, customDesc, customContext || 'No additional team context provided.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Pull Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review PRs with AI-powered summaries and team context awareness.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-border bg-card shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FiGitPullRequest className="w-4 h-4 text-primary" />
                Open PRs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {displayPRs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No PRs loaded. Use the form below to review any PR, or enable sample data.</p>
                ) : (
                  <div className="space-y-2">
                    {displayPRs.map((pr) => (
                      <button key={pr.id} onClick={() => setSelectedPR(pr)} className={`w-full text-left p-3 rounded-xl border transition-all ${selectedPR?.id === pr.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{pr.title}</p>
                          <FiChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">@{pr.author}</span>
                          <span className="text-xs text-muted-foreground">{pr.filesChanged} files</span>
                          <span className="text-xs text-green-400">+{pr.additions}</span>
                          <span className="text-xs text-destructive">-{pr.deletions}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{pr.age}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {selectedPR && (
                <Button onClick={handleReviewSelected} disabled={prReviewLoading} className="w-full mt-3">
                  {prReviewLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reviewing...</> : 'Generate Summary'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xl mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Custom PR Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="PR Title" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="bg-input border-border" />
              <Textarea placeholder="PR Description / Changes..." value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} rows={3} className="bg-input border-border resize-none" />
              <Textarea placeholder="Team context (optional)" value={customContext} onChange={(e) => setCustomContext(e.target.value)} rows={2} className="bg-input border-border resize-none" />
              <Button onClick={handleReviewCustom} disabled={prReviewLoading || !customTitle.trim() || !customDesc.trim()} size="sm" className="w-full">
                {prReviewLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reviewing...</> : 'Review This PR'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-border bg-card shadow-xl h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Review Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {!displayReview ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Select a PR and click &quot;Generate Summary&quot; to get an AI-powered review.</p>
                ) : (
                  <div className="space-y-4">
                    {displayReview.summary && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">Summary</h3>
                        {renderMarkdown(displayReview.summary)}
                      </div>
                    )}
                    <Separator />
                    {Array.isArray(displayReview.key_changes) && displayReview.key_changes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Key Changes</h3>
                        <div className="space-y-1.5">
                          {displayReview.key_changes.map((c, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <p className="text-sm text-foreground/80">{c}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(displayReview.potential_issues) && displayReview.potential_issues.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-semibold text-yellow-400 mb-2">Potential Issues</h3>
                          <div className="space-y-1.5">
                            {displayReview.potential_issues.map((issue, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                                <p className="text-sm text-foreground/80">{issue}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {displayReview.team_context && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-1">Team Context</h3>
                          {renderMarkdown(displayReview.team_context)}
                        </div>
                      </>
                    )}
                    {displayReview.recommendation && (
                      <>
                        <Separator />
                        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
                          <h3 className="text-sm font-semibold text-primary mb-1">Recommendation</h3>
                          {renderMarkdown(displayReview.recommendation)}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
