'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Github, User, Plus, Trash2, Check, Loader2 } from 'lucide-react'

interface TeamMember {
  _id?: string
  name: string
  github_username: string
  role?: string
}

interface GithubSettings {
  repo_owner: string
  repo_name: string
  github_token_ref: string
}

interface SettingsPageProps {
  teamMembers: TeamMember[]
  githubSettings: GithubSettings
  onSaveGithubSettings: (settings: GithubSettings) => Promise<void>
  onAddTeamMember: (member: { name: string; github_username: string; role: string }) => Promise<void>
  onRemoveTeamMember: (id: string) => Promise<void>
  settingsLoading: boolean
  settingsMessage: string
}

export default function SettingsPage({ teamMembers, githubSettings, onSaveGithubSettings, onAddTeamMember, onRemoveTeamMember, settingsLoading, settingsMessage }: SettingsPageProps) {
  const [ghForm, setGhForm] = useState<GithubSettings>({
    repo_owner: githubSettings.repo_owner,
    repo_name: githubSettings.repo_name,
    github_token_ref: githubSettings.github_token_ref,
  })
  const [memberForm, setMemberForm] = useState({ name: '', github_username: '', role: 'member' })
  const [ghSaved, setGhSaved] = useState(false)

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your GitHub repository and manage team members.</p>
      </div>

      {settingsMessage && (
        <div className="p-3 rounded-xl border border-border bg-secondary/30 text-sm text-foreground">{settingsMessage}</div>
      )}

      <Card className="border-border bg-card shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Github className="w-4 h-4 text-foreground" />
            GitHub Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Repository Owner</Label>
              <Input placeholder="e.g. acme-corp" value={ghForm.repo_owner} onChange={(e) => setGhForm((prev) => ({ ...prev, repo_owner: e.target.value }))} className="bg-input border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Repository Name</Label>
              <Input placeholder="e.g. web-app" value={ghForm.repo_name} onChange={(e) => setGhForm((prev) => ({ ...prev, repo_name: e.target.value }))} className="bg-input border-border" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">GitHub Token Reference (optional)</Label>
            <Input placeholder="e.g. github_pat_..." value={ghForm.github_token_ref} onChange={(e) => setGhForm((prev) => ({ ...prev, github_token_ref: e.target.value }))} className="bg-input border-border" type="password" />
          </div>
          <Button onClick={handleSaveGithub} disabled={settingsLoading || !ghForm.repo_owner.trim() || !ghForm.repo_name.trim()}>
            {settingsLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : ghSaved ? <><Check className="w-4 h-4 mr-2" />Saved</> : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 mb-4 flex-wrap">
            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input placeholder="Jane Doe" value={memberForm.name} onChange={(e) => setMemberForm((prev) => ({ ...prev, name: e.target.value }))} className="bg-input border-border" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <Label className="text-xs text-muted-foreground">GitHub Username</Label>
              <Input placeholder="janedoe" value={memberForm.github_username} onChange={(e) => setMemberForm((prev) => ({ ...prev, github_username: e.target.value }))} className="bg-input border-border" />
            </div>
            <div className="space-y-1.5 w-28">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Input placeholder="member" value={memberForm.role} onChange={(e) => setMemberForm((prev) => ({ ...prev, role: e.target.value }))} className="bg-input border-border" />
            </div>
            <Button onClick={handleAddMember} disabled={!memberForm.name.trim() || !memberForm.github_username.trim()} size="sm" className="h-9">
              <Plus className="w-4 h-4 mr-1" />Add
            </Button>
          </div>

          <ScrollArea className="h-48">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No team members yet. Add members above to start tracking their work.</p>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((m) => (
                  <div key={m._id ?? m.github_username} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{(m.name ?? '?')[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">@{m.github_username}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{m.role ?? 'member'}</Badge>
                    {m._id && (
                      <Button size="sm" variant="ghost" onClick={() => onRemoveTeamMember(m._id!)} className="h-8 w-8 p-0 text-destructive hover:text-red-300 hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
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
