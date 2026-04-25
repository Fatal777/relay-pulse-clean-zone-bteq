'use client'

import { useState } from 'react'
import { GitBranch, User, File, GitCommit, Clock, ArrowRight, Edit3, RefreshCw } from 'lucide-react'

interface Branch {
  _id?: string
  name: string
  repo_owner: string
  repo_name: string
  author?: string
  status?: string
  files_changed?: string[]
  commit_count?: number
  last_commit_message?: string
  last_commit_date?: string
  assigned_member?: string
  description?: string
  pulse_count?: number
  createdAt?: string
}

interface TeamMember {
  _id?: string
  name: string
  github_username: string
  role?: string
}

interface BranchViewProps {
  branch: Branch | null
  teamMembers: TeamMember[]
  onJoin: (branchId: string, memberName: string) => void
  onHandoff: (branchId: string, fromMember: string, toMember: string, notes: string) => void
  onUpdateBranch: (branchId: string, updates: Partial<Branch>) => void
  onSyncFromGithub: () => void
  syncLoading?: boolean
}

export default function BranchView({
  branch,
  teamMembers,
  onJoin,
  onHandoff,
  onUpdateBranch,
  onSyncFromGithub,
  syncLoading,
}: BranchViewProps) {
  const [handoffTo, setHandoffTo] = useState('')
  const [handoffNotes, setHandoffNotes] = useState('')
  const [showHandoff, setShowHandoff] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editDesc, setEditDesc] = useState('')

  if (!branch) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a branch to view details</p>
          <p className="text-xs mt-1">or create a new one to get started</p>
        </div>
      </div>
    )
  }

  const handleJoin = (memberName: string) => {
    if (branch._id) onJoin(branch._id, memberName)
  }

  const handleHandoff = () => {
    if (branch._id && handoffTo) {
      onHandoff(branch._id, branch.assigned_member || 'Unknown', handoffTo, handoffNotes)
      setHandoffTo('')
      setHandoffNotes('')
      setShowHandoff(false)
    }
  }

  const handleSaveDesc = () => {
    if (branch._id) {
      onUpdateBranch(branch._id, { description: editDesc })
      setEditing(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{branch.name}</h1>
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
              branch.status === 'active' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-muted text-muted-foreground border border-border'
            }`}>
              {branch.status || 'active'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {branch.repo_owner}/{branch.repo_name}
          </p>
        </div>
        <button
          onClick={onSyncFromGithub}
          disabled={syncLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
          Sync from GitHub
        </button>
      </div>

      {/* Description */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</h3>
          <button onClick={() => { setEditing(!editing); setEditDesc(branch.description || '') }} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleSaveDesc} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save</button>
              <button onClick={() => setEditing(false)} className="px-3 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground">{branch.description || 'No description'}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Assigned</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" />
            {branch.assigned_member || 'Unassigned'}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Files Changed</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <File className="w-3.5 h-3.5 text-accent" />
            {branch.files_changed?.length || 0}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Commits</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-purple-400" />
            {branch.commit_count || 0}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Last Commit</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            {branch.last_commit_date ? new Date(branch.last_commit_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Last Commit Message */}
      {branch.last_commit_message && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Last Commit</h3>
          <p className="text-sm text-foreground font-mono">{branch.last_commit_message}</p>
        </div>
      )}

      {/* Changed Files */}
      {branch.files_changed && branch.files_changed.length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Changed Files</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {branch.files_changed.map((file, i) => (
              <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-secondary/30">
                <File className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-foreground font-mono truncate">{file}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions: Join / Handoff */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</h3>
        <div className="flex flex-wrap gap-2">
          {teamMembers.map((m) => (
            <button
              key={m._id}
              onClick={() => handleJoin(m.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors border border-primary/20"
            >
              <User className="w-3 h-3" />
              Join as {m.name}
            </button>
          ))}
        </div>

        {branch.assigned_member && (
          <div>
            <button
              onClick={() => setShowHandoff(!showHandoff)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-medium hover:bg-yellow-500/20 transition-colors border border-yellow-500/20"
            >
              <ArrowRight className="w-3 h-3" />
              Handoff from {branch.assigned_member}
            </button>

            {showHandoff && (
              <div className="mt-3 space-y-2 p-3 rounded-lg bg-secondary/30 border border-border">
                <select
                  value={handoffTo}
                  onChange={(e) => setHandoffTo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Hand off to...</option>
                  {teamMembers
                    .filter((m) => m.name !== branch.assigned_member)
                    .map((m) => (
                      <option key={m._id} value={m.name}>{m.name}</option>
                    ))}
                </select>
                <input
                  type="text"
                  placeholder="Handoff notes (optional)"
                  value={handoffNotes}
                  onChange={(e) => setHandoffNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleHandoff}
                  disabled={!handoffTo}
                  className="px-4 py-1.5 rounded-lg bg-yellow-500 text-black text-xs font-medium hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Handoff
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
