'use client'

import React, { useState } from 'react'
import { Github, Users, Plus, Trash2, Check } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TeamMember    { _id?: string; name: string; github_username: string; role?: string }
interface GithubSettings { repo_owner: string; repo_name: string; github_token_ref: string }

interface SettingsPageProps {
  teamMembers:          TeamMember[]
  githubSettings:       GithubSettings
  onSaveGithubSettings: (s: GithubSettings) => Promise<void>
  onAddTeamMember:      (m: { name: string; github_username: string; role: string }) => Promise<void>
  onRemoveTeamMember:   (id: string) => Promise<void>
  settingsLoading:      boolean
  settingsMessage:      string
}

export default function SettingsPage({
  teamMembers, githubSettings, onSaveGithubSettings,
  onAddTeamMember, onRemoveTeamMember, settingsLoading, settingsMessage,
}: SettingsPageProps) {
  const [ghForm,  setGhForm]   = useState<GithubSettings>({ ...githubSettings })
  const [memberForm, setMemberForm] = useState({ name: '', github_username: '', role: 'member' })
  const [ghSaved, setGhSaved]  = useState(false)

  const handleSaveGithub = async () => {
    await onSaveGithubSettings(ghForm)
    setGhSaved(true)
    setTimeout(() => setGhSaved(false), 2000)
  }

  const handleAddMember = async () => {
    if (!memberForm.name.trim() || !memberForm.github_username.trim()) return
    await onAddTeamMember(memberForm)
    setMemberForm({ name: '', github_username: '', role: 'member' })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">Configure your GitHub repository and manage team members.</p>
      </div>

      {settingsMessage && (
        <div className="blade p-3 text-[12.5px] text-foreground border-l-2 border-l-primary">
          {settingsMessage}
        </div>
      )}

      {/* GitHub connection */}
      <div className="blade">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Github className="h-4 w-4 text-muted-foreground" />
          <span className="text-[13px] font-semibold text-foreground">GitHub Connection</span>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide">Repository Owner</Label>
              <Input
                placeholder="e.g. Fatal777"
                value={ghForm.repo_owner}
                onChange={(e) => setGhForm((p) => ({ ...p, repo_owner: e.target.value }))}
                className="relay-input h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide">Repository Name</Label>
              <Input
                placeholder="e.g. relay-demo-conflicts"
                value={ghForm.repo_name}
                onChange={(e) => setGhForm((p) => ({ ...p, repo_name: e.target.value }))}
                className="relay-input h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11.5px] text-muted-foreground font-medium uppercase tracking-wide">GitHub Token (PAT)</Label>
            <Input
              type="password"
              placeholder="ghp_…"
              value={ghForm.github_token_ref}
              onChange={(e) => setGhForm((p) => ({ ...p, github_token_ref: e.target.value }))}
              className="relay-input h-9"
            />
            <p className="text-[11px] text-muted-foreground">Personal Access Token with <code className="font-mono text-[10.5px] bg-muted px-1 rounded">repo</code> scope. Required to read private repos.</p>
          </div>
          <button
            onClick={handleSaveGithub}
            disabled={settingsLoading || !ghForm.repo_owner.trim() || !ghForm.repo_name.trim()}
            className="btn-primary h-8 px-4 text-[12.5px] disabled:opacity-50 flex items-center gap-1.5"
          >
            {settingsLoading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
            ) : ghSaved ? (
              <><Check className="h-3.5 w-3.5" />Saved</>
            ) : (
              'Save & Sync Branches'
            )}
          </button>
        </div>
      </div>

      {/* Team members */}
      <div className="blade">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-[13px] font-semibold text-foreground">Team Members</span>
          <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{teamMembers.length}</span>
        </div>

        {/* Add member form */}
        <div className="p-4 border-b border-border">
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-36 space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Full Name</Label>
              <Input
                placeholder="Jane Doe"
                value={memberForm.name}
                onChange={(e) => setMemberForm((p) => ({ ...p, name: e.target.value }))}
                className="relay-input h-8 text-[12.5px]"
              />
            </div>
            <div className="flex-1 min-w-36 space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">GitHub Username</Label>
              <Input
                placeholder="janedoe"
                value={memberForm.github_username}
                onChange={(e) => setMemberForm((p) => ({ ...p, github_username: e.target.value }))}
                className="relay-input h-8 text-[12.5px]"
              />
            </div>
            <div className="w-28 space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Role</Label>
              <Input
                placeholder="member"
                value={memberForm.role}
                onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value }))}
                className="relay-input h-8 text-[12.5px]"
              />
            </div>
            <button
              onClick={handleAddMember}
              disabled={!memberForm.name.trim() || !memberForm.github_username.trim()}
              className="btn-primary h-8 px-3 text-[12.5px] disabled:opacity-50 flex items-center gap-1.5 mb-0.5"
            >
              <Plus className="h-3.5 w-3.5" />Add
            </button>
          </div>
        </div>

        {/* Member list */}
        <div className="divide-y divide-border">
          {teamMembers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[12.5px] text-muted-foreground">No team members yet. Add members to track their branches.</p>
            </div>
          ) : (
            teamMembers.map((m) => (
              <div key={m._id ?? m.github_username} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary">
                  {(m.name ?? '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{m.name}</p>
                  <p className="text-[11.5px] text-muted-foreground font-mono">@{m.github_username}</p>
                </div>
                <span className="chip bg-muted text-muted-foreground border-border">{m.role ?? 'member'}</span>
                {m._id && (
                  <button
                    onClick={() => onRemoveTeamMember(m._id!)}
                    className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-conflict hover:bg-conflict/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Demo info */}
      <div className="blade p-4 bg-muted/50">
        <p className="section-label mb-1.5">Demo Repo</p>
        <p className="text-[12.5px] text-muted-foreground">
          Use <code className="filepath">Fatal777 / relay-demo-conflicts</code> as the repo — it has 5 branches and 3 open PRs with deliberate conflicts for demo purposes. No token required (public repo).
        </p>
      </div>
    </div>
  )
}
