'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AuthProvider, LoginForm, RegisterForm, ProtectedRoute, UserMenu } from 'lyzr-architect/client'
import { callAIAgent } from '@/lib/aiAgent'
import { Zap } from 'lucide-react'
import LeftRail from './sections/LeftRail'
import BranchSidebar, { type BranchSession } from './sections/BranchSidebar'
import PulsePanel, { type PulseEvent } from './sections/PulsePanel'
import HomePage from './sections/HomePage'
import DecisionsPage from './sections/DecisionsPage'
import PullRequestsPage from './sections/PullRequestsPage'
import SettingsPage from './sections/SettingsPage'
import BranchView from './sections/BranchView'

// ─── Agent IDs ───────────────────────────────────────────────────────────────
const DECISION_AGENT_ID = '69ec53125a4288a9a1e231a4'
const PR_REVIEW_AGENT_ID = '69ec532e38d52edd6342f1db'
const CONFLICT_AGENT_ID  = '69ec532f950816878e84f0fa'

// ─── Relay light theme — warm off-white surfaces, blue accent ────────────────
const THEME_VARS = {
  '--background':        '40 30% 97%',
  '--foreground':        '220 15% 18%',
  '--card':              '0 0% 100%',
  '--card-foreground':   '220 15% 18%',
  '--popover':           '0 0% 100%',
  '--popover-foreground':'220 15% 18%',
  '--primary':           '214 60% 52%',
  '--primary-foreground':'0 0% 100%',
  '--secondary':         '40 20% 94%',
  '--secondary-foreground':'220 12% 30%',
  '--accent':            '214 60% 52%',
  '--accent-foreground': '0 0% 100%',
  '--destructive':       '0 65% 52%',
  '--destructive-foreground':'0 0% 100%',
  '--muted':             '40 18% 91%',
  '--muted-foreground':  '220 8% 48%',
  '--border':            '220 12% 88%',
  '--input':             '220 12% 92%',
  '--ring':              '214 60% 52%',
  '--radius':            '0.875rem',
  '--chart-1':           '214 60% 52%',
  '--chart-2':           '152 42% 40%',
  '--chart-3':           '36 80% 48%',
  '--chart-4':           '0 65% 52%',
  '--chart-5':           '264 50% 55%',
  '--sidebar-background':        '40 25% 95%',
  '--sidebar-foreground':        '220 15% 18%',
  '--sidebar-primary':           '214 60% 52%',
  '--sidebar-primary-foreground':'0 0% 100%',
  '--sidebar-accent':            '214 40% 92%',
  '--sidebar-accent-foreground': '214 60% 40%',
  '--sidebar-border':            '220 12% 88%',
  '--sidebar-ring':              '214 60% 52%',
} as React.CSSProperties

// ─── Helper ───────────────────────────────────────────────────────────────────
function parseAgentResponse(result: any) {
  try {
    const response = result?.response
    if (!response) return null
    let data = response.result || response.message
    if (typeof data === 'string') {
      try { data = JSON.parse(data) } catch { return { text: data } }
    }
    return data
  } catch { return null }
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md blade">
            <h2 className="text-lg font-semibold mb-2 text-foreground">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="btn-primary h-8 px-4 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md p-6">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground tracking-tight">Relay</span>
        </div>
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        )}
      </div>
    </div>
  )
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface TeamMember        { _id?: string; name: string; github_username: string; role?: string }
interface GithubSettings    { repo_owner: string; repo_name: string; github_token_ref: string }
interface DecisionItem      { _id?: string; decision_text: string; decided_date: string; feature_area: string; source_notes?: string; confidence?: string }
interface ExtractedDecision { decision_text?: string; decided_date?: string; feature_area?: string; confidence?: string }
interface ConflictResult    { conflicts?: any[]; overall_risk?: string; summary?: string }
interface PRReviewResult    { summary?: string; key_changes?: string[]; potential_issues?: string[]; team_context?: string; recommendation?: string }

// ─── Main App Content ─────────────────────────────────────────────────────────
function AppContent() {
  const [activePage,      setActivePage]      = useState('home')
  const [activeBranchId,  setActiveBranchId]  = useState<string | null>(null)
  const [activeAgentId,   setActiveAgentId]   = useState<string | null>(null)

  // Data state
  const [teamMembers,      setTeamMembers]      = useState<TeamMember[]>([])
  const [decisions,        setDecisions]        = useState<DecisionItem[]>([])
  const [githubSettings,   setGithubSettings]   = useState<GithubSettings>({ repo_owner: '', repo_name: '', github_token_ref: '' })
  const [branches,         setBranches]         = useState<BranchSession[]>([])
  const [pulseEvents,      setPulseEvents]      = useState<PulseEvent[]>([])
  const [newPulseCount,    setNewPulseCount]    = useState(0)
  const lastPulseRef  = useRef<string | null>(null)
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Branch-specific agent state
  const [conflictResult,   setConflictResult]   = useState<ConflictResult | null>(null)
  const [conflictLoading,  setConflictLoading]  = useState(false)
  const [prReviewResult,   setPrReviewResult]   = useState<PRReviewResult | null>(null)
  const [prReviewLoading,  setPrReviewLoading]  = useState(false)

  // Decision extraction state
  const [extractedDecisions, setExtractedDecisions] = useState<ExtractedDecision[]>([])
  const [extractionLoading,  setExtractionLoading]  = useState(false)
  const [extractionSummary,  setExtractionSummary]  = useState('')

  // Settings state
  const [settingsLoading,  setSettingsLoading]  = useState(false)
  const [settingsMessage,  setSettingsMessage]  = useState('')
  const [branchSyncing,    setBranchSyncing]    = useState(false)

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchTeamMembers = useCallback(async () => {
    try {
      const res  = await fetch('/api/team-members')
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) setTeamMembers(data.data)
    } catch {}
  }, [])

  const fetchDecisions = useCallback(async () => {
    try {
      const res  = await fetch('/api/decisions')
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) setDecisions(data.data)
    } catch {}
  }, [])

  const fetchGithubSettings = useCallback(async () => {
    try {
      const res  = await fetch('/api/github-settings')
      const data = await res.json()
      if (data?.success && data.data) {
        setGithubSettings({
          repo_owner:      data.data.repo_owner      ?? '',
          repo_name:       data.data.repo_name       ?? '',
          github_token_ref: data.data.github_token_ref ?? '',
        })
      }
    } catch {}
  }, [])

  const fetchBranches = useCallback(async () => {
    try {
      const res  = await fetch('/api/branches')
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) setBranches(data.data)
    } catch {}
  }, [])

  const fetchPulse = useCallback(async () => {
    try {
      const url  = lastPulseRef.current ? `/api/pulse?since=${encodeURIComponent(lastPulseRef.current)}` : '/api/pulse'
      const res  = await fetch(url)
      const data = await res.json()
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        setPulseEvents((prev) => [...data.data, ...prev].slice(0, 100))
        setNewPulseCount((p) => p + data.data.length)
        lastPulseRef.current = data.data[0].created_at
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchTeamMembers()
    fetchDecisions()
    fetchGithubSettings()
    fetchBranches()
    fetchPulse()
  }, [fetchTeamMembers, fetchDecisions, fetchGithubSettings, fetchBranches, fetchPulse])

  // Poll pulse every 8 seconds
  useEffect(() => {
    pulseTimerRef.current = setInterval(fetchPulse, 8000)
    return () => { if (pulseTimerRef.current) clearInterval(pulseTimerRef.current) }
  }, [fetchPulse])

  // ── Branch sync ──────────────────────────────────────────────────────────
  const handleSyncBranches = useCallback(async () => {
    setBranchSyncing(true)
    try {
      const res  = await fetch('/api/branches', { method: 'POST' })
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) setBranches(data.data)
    } catch {}
    setBranchSyncing(false)
  }, [])

  const handleSelectBranch = useCallback((id: string) => {
    setActiveBranchId(id)
    setActivePage('branch-view')
    // Reset agent results when switching branches
    setConflictResult(null)
    setPrReviewResult(null)
    setExtractedDecisions([])
    setExtractionSummary('')
  }, [])

  // ── Conflict Analysis ────────────────────────────────────────────────────
  const handleAnalyzeConflicts = useCallback(async (branchName?: string) => {
    setConflictLoading(true)
    setActiveAgentId(CONFLICT_AGENT_ID)
    try {
      const owner  = githubSettings.repo_owner  || 'unknown'
      const repo   = githubSettings.repo_name   || 'unknown'
      const token  = githubSettings.github_token_ref || ''
      const memberNames = teamMembers.map((m) => `${m.name} (@${m.github_username})`).join(', ')
      let message  = ''

      if (token && owner !== 'unknown' && repo !== 'unknown') {
        const contextRes  = await fetch(
          `/api/github/context?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&token=${encodeURIComponent(token)}`
        )
        const contextData = await contextRes.json()

        if (contextRes.ok && contextData.branches) {
          const branchSummary = contextData.branches
            .map((b: { name: string; author: string; files: string[] }) =>
              `Branch "${b.name}" (author: ${b.author}): ${b.files.length} changed files [${b.files.slice(0, 20).join(', ')}${b.files.length > 20 ? '...' : ''}]`
            )
            .join('\n')
          const conflictSummary = Array.isArray(contextData.conflictingFiles) && contextData.conflictingFiles.length > 0
            ? `\n\nFiles touched by multiple branches:\n${contextData.conflictingFiles.map((c: { file: string; branches: string[] }) => `- ${c.file} (branches: ${c.branches.join(', ')})`).join('\n')}`
            : '\n\nNo files are touched by multiple branches.'

          const scopeNote = branchName ? `\nFocus on conflicts involving branch: ${branchName}` : ''
          message = `Analyze conflicts for repo ${owner}/${repo}.\n\nActive branches:\n${branchSummary}${conflictSummary}${scopeNote}\n\nTeam members: ${memberNames || 'none specified'}.\n\nRate the conflict severity for each overlapping file and provide an overall risk assessment.`
        } else {
          message = `Analyze active branches for conflicts in repo ${owner}/${repo}. Team members: ${memberNames || 'none specified'}.${branchName ? ` Focus on branch: ${branchName}` : ''}`
        }
      } else {
        message = `Analyze active branches for conflicts in repo ${owner}/${repo}. Team members: ${memberNames || 'none specified'}.${branchName ? ` Focus on branch: ${branchName}` : ''}`
      }

      const result = await callAIAgent(message, CONFLICT_AGENT_ID)
      const data   = parseAgentResponse(result)
      if (data) setConflictResult(data)
    } catch {}
    setConflictLoading(false)
    setActiveAgentId(null)
  }, [githubSettings, teamMembers])

  // ── PR Review ────────────────────────────────────────────────────────────
  const handleReviewPR = useCallback(async (title: string, description: string, teamContext: string) => {
    setPrReviewLoading(true)
    setActiveAgentId(PR_REVIEW_AGENT_ID)
    try {
      const message = `Review this PR: ${title}. Changes: ${description}. Team context: ${teamContext}`
      const result  = await callAIAgent(message, PR_REVIEW_AGENT_ID)
      const data    = parseAgentResponse(result)
      if (data) setPrReviewResult(data)
    } catch {}
    setPrReviewLoading(false)
    setActiveAgentId(null)
  }, [])

  // ── Decision Extraction ──────────────────────────────────────────────────
  const handleExtractDecisions = useCallback(async (notes: string, branchId?: string) => {
    setExtractionLoading(true)
    setActiveAgentId(DECISION_AGENT_ID)
    setExtractionSummary('')
    try {
      const result = await callAIAgent(notes, DECISION_AGENT_ID)
      const data   = parseAgentResponse(result)
      if (data) {
        const decs = Array.isArray(data.decisions) ? data.decisions : []
        setExtractedDecisions(decs)
        setExtractionSummary(data.summary ?? '')
      }
    } catch {}
    setExtractionLoading(false)
    setActiveAgentId(null)
  }, [])

  const handleSaveDecision = useCallback(async (d: ExtractedDecision, branchId?: string) => {
    try {
      const res  = await fetch('/api/decisions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          decision_text: d.decision_text ?? '',
          decided_date:  d.decided_date  ?? new Date().toISOString().slice(0, 10),
          feature_area:  d.feature_area  ?? 'General',
          confidence:    d.confidence    ?? '',
          branch_id:     branchId,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        setExtractedDecisions((prev) => prev.filter((item) => item !== d))
        fetchDecisions()
        // Emit pulse event
        await fetch('/api/pulse', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            kind:        'decision_saved',
            branch_id:   branchId,
            payload:     { text: (d.decision_text ?? '').slice(0, 80) },
          }),
        })
        fetchPulse()
      }
    } catch {}
  }, [fetchDecisions, fetchPulse])

  const handleDismissExtracted = useCallback((index: number) => {
    setExtractedDecisions((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // ── GitHub Settings ──────────────────────────────────────────────────────
  const handleSaveGithubSettings = useCallback(async (settings: GithubSettings) => {
    setSettingsLoading(true)
    setSettingsMessage('')
    try {
      const res  = await fetch('/api/github-settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      })
      const data = await res.json()
      if (data?.success) {
        setGithubSettings(settings)
        setSettingsMessage('GitHub settings saved. Syncing branches…')
        await handleSyncBranches()
        setSettingsMessage('GitHub settings saved.')
      } else {
        setSettingsMessage(data?.error ?? 'Failed to save settings.')
      }
    } catch { setSettingsMessage('Network error saving settings.') }
    setSettingsLoading(false)
  }, [handleSyncBranches])

  // ── Team Members ─────────────────────────────────────────────────────────
  const handleAddTeamMember = useCallback(async (member: { name: string; github_username: string; role: string }) => {
    try {
      const res  = await fetch('/api/team-members', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(member),
      })
      const data = await res.json()
      if (data?.success) fetchTeamMembers()
    } catch {}
  }, [fetchTeamMembers])

  const handleRemoveTeamMember = useCallback(async (id: string) => {
    try {
      const res  = await fetch(`/api/team-members?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data?.success) fetchTeamMembers()
    } catch {}
  }, [fetchTeamMembers])

  // ── Branch status handoff ────────────────────────────────────────────────
  const handleBranchHandoff = useCallback(async (branchId: string) => {
    try {
      await fetch(`/api/branches/${branchId}/handoff`, { method: 'POST' })
      fetchBranches()
      fetchPulse()
    } catch {}
  }, [fetchBranches, fetchPulse])

  // ── Active branch data ────────────────────────────────────────────────────
  const activeBranch = branches.find((b) => b._id === activeBranchId) ?? null
  const branchDecisions = decisions.filter(
    (d: any) => d.branch_id && activeBranchId && d.branch_id === activeBranchId
  )

  // ── Page title ────────────────────────────────────────────────────────────
  function pageTitle() {
    if (activePage === 'branch-view' && activeBranch) return activeBranch.branch_name
    const titles: Record<string, string> = {
      home:            'Overview',
      branches:        'Branches',
      decisions:       'Decision Log',
      'pull-requests': 'Pull Requests',
      settings:        'Settings',
    }
    return titles[activePage] ?? 'Relay'
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* LeftRail: 56px */}
      <LeftRail activePage={activePage} onNavigate={setActivePage} pulseCount={newPulseCount} />

      {/* BranchSidebar: 288px — visible on branches / branch-view pages */}
      {(activePage === 'branches' || activePage === 'branch-view' || activePage === 'home') && (
        <BranchSidebar
          branches={branches}
          activeBranchId={activeBranchId}
          onSelectBranch={handleSelectBranch}
          onSync={handleSyncBranches}
          syncing={branchSyncing}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Page header */}
        <header className="h-11 flex items-center justify-between px-5 border-b border-border bg-background shrink-0">
          <h1 className="text-[13.5px] font-semibold text-foreground truncate">{pageTitle()}</h1>
          <div className="flex items-center gap-3 shrink-0">
            <UserMenu />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto scroll-clean">
          <div className="p-6 max-w-5xl mx-auto">
            {activePage === 'home' && (
              <HomePage
                teamMembers={teamMembers}
                branches={branches}
                repoOwner={githubSettings.repo_owner}
                repoName={githubSettings.repo_name}
                conflictResult={conflictResult}
                conflictLoading={conflictLoading}
                activeAgentId={activeAgentId === CONFLICT_AGENT_ID ? activeAgentId : null}
                onAnalyzeConflicts={() => handleAnalyzeConflicts()}
                onSelectBranch={handleSelectBranch}
                showSample={false}
              />
            )}
            {(activePage === 'branches') && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="blade p-8">
                  <p className="text-muted-foreground text-sm">Select a branch from the sidebar to open its workspace.</p>
                  {branches.length === 0 && (
                    <button onClick={handleSyncBranches} className="btn-primary mt-4 h-8 px-4 text-sm">
                      Sync from GitHub
                    </button>
                  )}
                </div>
              </div>
            )}
            {activePage === 'branch-view' && activeBranch && (
              <BranchView
                branch={activeBranch}
                branchDecisions={branchDecisions}
                allDecisions={decisions}
                extractedDecisions={extractedDecisions}
                extractionLoading={extractionLoading}
                extractionSummary={extractionSummary}
                conflictResult={conflictResult}
                conflictLoading={conflictLoading}
                prReviewResult={prReviewResult}
                prReviewLoading={prReviewLoading}
                activeAgentId={activeAgentId}
                conflictAgentId={CONFLICT_AGENT_ID}
                prReviewAgentId={PR_REVIEW_AGENT_ID}
                decisionAgentId={DECISION_AGENT_ID}
                teamMembers={teamMembers}
                repoOwner={githubSettings.repo_owner}
                repoName={githubSettings.repo_name}
                githubToken={githubSettings.github_token_ref}
                onAnalyzeConflicts={() => handleAnalyzeConflicts(activeBranch.branch_name)}
                onReviewPR={handleReviewPR}
                onExtractDecisions={(notes) => handleExtractDecisions(notes, activeBranchId ?? undefined)}
                onSaveDecision={(d) => handleSaveDecision(d, activeBranchId ?? undefined)}
                onDismissExtracted={handleDismissExtracted}
                onHandoff={() => activeBranchId && handleBranchHandoff(activeBranchId)}
              />
            )}
            {activePage === 'decisions' && (
              <DecisionsPage
                decisions={decisions}
                extractedDecisions={extractedDecisions}
                extractionLoading={extractionLoading}
                extractionSummary={extractionSummary}
                activeAgentId={activeAgentId === DECISION_AGENT_ID ? activeAgentId : null}
                onExtractDecisions={(notes) => handleExtractDecisions(notes)}
                onSaveDecision={(d) => handleSaveDecision(d)}
                onDismissExtracted={handleDismissExtracted}
                onRefreshDecisions={fetchDecisions}
                showSample={false}
              />
            )}
            {activePage === 'pull-requests' && (
              <PullRequestsPage
                prReviewResult={prReviewResult}
                prReviewLoading={prReviewLoading}
                activeAgentId={activeAgentId === PR_REVIEW_AGENT_ID ? activeAgentId : null}
                onReviewPR={handleReviewPR}
                showSample={false}
              />
            )}
            {activePage === 'settings' && (
              <SettingsPage
                teamMembers={teamMembers}
                githubSettings={githubSettings}
                onSaveGithubSettings={handleSaveGithubSettings}
                onAddTeamMember={handleAddTeamMember}
                onRemoveTeamMember={handleRemoveTeamMember}
                settingsLoading={settingsLoading}
                settingsMessage={settingsMessage}
              />
            )}
          </div>
        </div>
      </main>

      {/* PulsePanel: 44px collapsed / 288px expanded */}
      <PulsePanel
        events={pulseEvents}
        newCount={newPulseCount}
        onClearNew={() => setNewPulseCount(0)}
      />
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProtectedRoute unauthenticatedFallback={
          <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans">
            <AuthScreen />
          </div>
        }>
          <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans">
            <AppContent />
          </div>
        </ProtectedRoute>
      </AuthProvider>
    </ErrorBoundary>
  )
}
