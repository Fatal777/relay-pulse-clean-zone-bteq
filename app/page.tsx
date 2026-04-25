'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AuthProvider, LoginForm, RegisterForm, ProtectedRoute, UserMenu } from 'lyzr-architect/client'
import { callAIAgent } from '@/lib/aiAgent'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { FiGitPullRequest } from 'react-icons/fi'
import Sidebar from './sections/Sidebar'
import HomePage from './sections/HomePage'
import DecisionsPage from './sections/DecisionsPage'
import PullRequestsPage from './sections/PullRequestsPage'
import SettingsPage from './sections/SettingsPage'

const DECISION_AGENT_ID = '69ec53125a4288a9a1e231a4'
const PR_REVIEW_AGENT_ID = '69ec532e38d52edd6342f1db'
const CONFLICT_AGENT_ID = '69ec532f950816878e84f0fa'

const THEME_VARS = {
  '--background': '231 18% 14%',
  '--foreground': '60 30% 96%',
  '--card': '232 16% 18%',
  '--card-foreground': '60 30% 96%',
  '--popover': '232 16% 22%',
  '--popover-foreground': '60 30% 96%',
  '--primary': '265 89% 72%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '232 16% 24%',
  '--secondary-foreground': '60 30% 96%',
  '--accent': '135 94% 60%',
  '--accent-foreground': '231 18% 10%',
  '--destructive': '0 100% 62%',
  '--destructive-foreground': '0 0% 100%',
  '--muted': '232 16% 28%',
  '--muted-foreground': '228 10% 62%',
  '--border': '232 16% 28%',
  '--input': '232 16% 32%',
  '--ring': '265 89% 72%',
  '--radius': '0.875rem',
  '--chart-1': '265 89% 72%',
  '--chart-2': '135 94% 60%',
  '--chart-3': '191 97% 70%',
  '--chart-4': '326 100% 68%',
  '--chart-5': '31 100% 65%',
  '--sidebar-background': '231 18% 12%',
  '--sidebar-foreground': '60 30% 96%',
  '--sidebar-border': '232 16% 22%',
  '--sidebar-primary': '265 89% 72%',
  '--sidebar-primary-foreground': '0 0% 100%',
  '--sidebar-accent': '232 16% 20%',
  '--sidebar-accent-foreground': '60 30% 96%',
} as React.CSSProperties

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
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  return (
    <div style={THEME_VARS} className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md p-6">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <FiGitPullRequest className="w-5 h-5 text-primary-foreground" />
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

interface TeamMember { _id?: string; name: string; github_username: string; role?: string }
interface GithubSettings { repo_owner: string; repo_name: string; github_token_ref: string }
interface DecisionItem { _id?: string; decision_text: string; decided_date: string; feature_area: string; source_notes?: string; confidence?: string }
interface ExtractedDecision { decision_text?: string; decided_date?: string; feature_area?: string; confidence?: string }
interface ConflictResult { conflicts?: any[]; overall_risk?: string; summary?: string }
interface PRReviewResult { summary?: string; key_changes?: string[]; potential_issues?: string[]; team_context?: string; recommendation?: string }

function AppContent() {
  const [activePage, setActivePage] = useState('home')
  const [showSample, setShowSample] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [decisions, setDecisions] = useState<DecisionItem[]>([])
  const [githubSettings, setGithubSettings] = useState<GithubSettings>({ repo_owner: '', repo_name: '', github_token_ref: '' })

  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null)
  const [conflictLoading, setConflictLoading] = useState(false)

  const [prReviewResult, setPrReviewResult] = useState<PRReviewResult | null>(null)
  const [prReviewLoading, setPrReviewLoading] = useState(false)

  const [extractedDecisions, setExtractedDecisions] = useState<ExtractedDecision[]>([])
  const [extractionLoading, setExtractionLoading] = useState(false)
  const [extractionSummary, setExtractionSummary] = useState('')

  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState('')

  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team-members')
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) setTeamMembers(data.data)
    } catch {}
  }, [])

  const fetchDecisions = useCallback(async () => {
    try {
      const res = await fetch('/api/decisions')
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) setDecisions(data.data)
    } catch {}
  }, [])

  const fetchGithubSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/github-settings')
      const data = await res.json()
      if (data?.success && data.data) {
        setGithubSettings({
          repo_owner: data.data.repo_owner ?? '',
          repo_name: data.data.repo_name ?? '',
          github_token_ref: data.data.github_token_ref ?? '',
        })
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchTeamMembers()
    fetchDecisions()
    fetchGithubSettings()
  }, [fetchTeamMembers, fetchDecisions, fetchGithubSettings])

  const handleAnalyzeConflicts = async () => {
    setConflictLoading(true)
    setActiveAgentId(CONFLICT_AGENT_ID)
    try {
      const owner = githubSettings.repo_owner || 'unknown'
      const repo = githubSettings.repo_name || 'unknown'
      const token = githubSettings.github_token_ref || ''
      const memberNames = teamMembers.map((m) => `${m.name} (@${m.github_username})`).join(', ')

      let message = ''

      if (token && owner !== 'unknown' && repo !== 'unknown') {
        // Fetch real branch data from our API route
        const contextRes = await fetch(
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

          message = `Analyze conflicts for repo ${owner}/${repo}.\n\nActive branches:\n${branchSummary}${conflictSummary}\n\nTeam members: ${memberNames || 'none specified'}.\n\nRate the conflict severity for each overlapping file and provide an overall risk assessment.`
        } else {
          message = `Analyze active branches for conflicts in repo ${owner}/${repo}. Team members: ${memberNames || 'none specified'}. Check for file-level overlaps and rate severity. Note: Could not fetch branch data from GitHub (${contextData.error || 'unknown error'}).`
        }
      } else {
        message = `Analyze active branches for conflicts in repo ${owner}/${repo}. Team members: ${memberNames || 'none specified'}. Check for file-level overlaps and rate severity.`
      }

      const result = await callAIAgent(message, CONFLICT_AGENT_ID)
      const data = parseAgentResponse(result)
      if (data) setConflictResult(data)
    } catch {}
    setConflictLoading(false)
    setActiveAgentId(null)
  }

  const handleReviewPR = async (title: string, description: string, teamContext: string) => {
    setPrReviewLoading(true)
    setActiveAgentId(PR_REVIEW_AGENT_ID)
    try {
      const message = `Review this PR: ${title}. Changes: ${description}. Team context: ${teamContext}`
      const result = await callAIAgent(message, PR_REVIEW_AGENT_ID)
      const data = parseAgentResponse(result)
      if (data) setPrReviewResult(data)
    } catch {}
    setPrReviewLoading(false)
    setActiveAgentId(null)
  }

  const handleExtractDecisions = async (notes: string) => {
    setExtractionLoading(true)
    setActiveAgentId(DECISION_AGENT_ID)
    setExtractionSummary('')
    try {
      const result = await callAIAgent(notes, DECISION_AGENT_ID)
      const data = parseAgentResponse(result)
      if (data) {
        const decs = Array.isArray(data.decisions) ? data.decisions : []
        setExtractedDecisions(decs)
        setExtractionSummary(data.summary ?? '')
      }
    } catch {}
    setExtractionLoading(false)
    setActiveAgentId(null)
  }

  const handleSaveDecision = async (d: ExtractedDecision) => {
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision_text: d.decision_text ?? '',
          decided_date: d.decided_date ?? '2026-04-25',
          feature_area: d.feature_area ?? 'General',
          confidence: d.confidence ?? '',
        }),
      })
      const data = await res.json()
      if (data?.success) {
        setExtractedDecisions((prev) => prev.filter((item) => item !== d))
        fetchDecisions()
      }
    } catch {}
  }

  const handleDismissExtracted = (index: number) => {
    setExtractedDecisions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveGithubSettings = async (settings: GithubSettings) => {
    setSettingsLoading(true)
    setSettingsMessage('')
    try {
      const res = await fetch('/api/github-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data?.success) {
        setGithubSettings(settings)
        setSettingsMessage('GitHub settings saved successfully.')
      } else {
        setSettingsMessage(data?.error ?? 'Failed to save settings.')
      }
    } catch { setSettingsMessage('Network error saving settings.') }
    setSettingsLoading(false)
  }

  const handleAddTeamMember = async (member: { name: string; github_username: string; role: string }) => {
    try {
      const res = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      })
      const data = await res.json()
      if (data?.success) fetchTeamMembers()
    } catch {}
  }

  const handleRemoveTeamMember = async (id: string) => {
    try {
      const res = await fetch(`/api/team-members?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data?.success) fetchTeamMembers()
    } catch {}
  }

  const agents = [
    { id: DECISION_AGENT_ID, name: 'Decision Extraction', purpose: 'Extracts structured decisions from meeting notes' },
    { id: PR_REVIEW_AGENT_ID, name: 'PR Review', purpose: 'Generates AI-powered PR review summaries' },
    { id: CONFLICT_AGENT_ID, name: 'Conflict Analysis', purpose: 'Detects file-level merge conflicts across branches' },
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="sample-toggle" checked={showSample} onCheckedChange={setShowSample} />
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
            </div>
            <UserMenu />
          </div>
        </header>
        <div className="p-6 max-w-6xl mx-auto">
          {activePage === 'home' && (
            <HomePage teamMembers={teamMembers} repoOwner={githubSettings.repo_owner} repoName={githubSettings.repo_name} conflictResult={conflictResult} conflictLoading={conflictLoading} activeAgentId={activeAgentId === CONFLICT_AGENT_ID ? activeAgentId : null} onAnalyzeConflicts={handleAnalyzeConflicts} showSample={showSample} />
          )}
          {activePage === 'decisions' && (
            <DecisionsPage decisions={decisions} extractedDecisions={extractedDecisions} extractionLoading={extractionLoading} extractionSummary={extractionSummary} activeAgentId={activeAgentId === DECISION_AGENT_ID ? activeAgentId : null} onExtractDecisions={handleExtractDecisions} onSaveDecision={handleSaveDecision} onDismissExtracted={handleDismissExtracted} onRefreshDecisions={fetchDecisions} showSample={showSample} />
          )}
          {activePage === 'pull-requests' && (
            <PullRequestsPage prReviewResult={prReviewResult} prReviewLoading={prReviewLoading} activeAgentId={activeAgentId === PR_REVIEW_AGENT_ID ? activeAgentId : null} onReviewPR={handleReviewPR} showSample={showSample} />
          )}
          {activePage === 'settings' && (
            <SettingsPage teamMembers={teamMembers} githubSettings={githubSettings} onSaveGithubSettings={handleSaveGithubSettings} onAddTeamMember={handleAddTeamMember} onRemoveTeamMember={handleRemoveTeamMember} settingsLoading={settingsLoading} settingsMessage={settingsMessage} />
          )}

          <div className="mt-8 p-4 rounded-xl border border-border bg-card/50">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Powered by AI Agents</p>
            <div className="flex flex-wrap gap-2">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 border border-border">
                  <span className={`w-2 h-2 rounded-full ${activeAgentId === a.id ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
                  <span className="text-xs text-foreground">{a.name}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">- {a.purpose}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Page() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProtectedRoute unauthenticatedFallback={<AuthScreen />}>
          <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans">
            <AppContent />
          </div>
        </ProtectedRoute>
      </AuthProvider>
    </ErrorBoundary>
  )
}
