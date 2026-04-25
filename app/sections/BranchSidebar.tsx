'use client'

import React, { useState } from 'react'
import { GitBranch, RefreshCw, ChevronDown, AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react'

export interface BranchSession {
  _id: string
  branch_name: string
  kind: 'feature' | 'fix' | 'chore' | 'refactor'
  status: 'active' | 'review' | 'merged' | 'abandoned'
  github_author: string
  collaborator_user_ids?: string[]
  hasConflict?: boolean
  last_synced_at?: string
  repo_owner?: string
  repo_name?: string
}

interface BranchSidebarProps {
  branches: BranchSession[]
  activeBranchId: string | null
  onSelectBranch: (id: string) => void
  onSync: () => void
  syncing: boolean
}

const KIND_CHIP: Record<string, string> = {
  feature:  'chip-feature',
  fix:      'chip-fix',
  chore:    'chip-chore',
  refactor: 'chip-refactor',
}

function kindLabel(kind: string) {
  return kind.charAt(0).toUpperCase() + kind.slice(1)
}

function timeAgo(iso?: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function SectionGroup({
  label,
  branches,
  activeBranchId,
  onSelectBranch,
  defaultOpen = true,
}: {
  label: string
  branches: BranchSession[]
  activeBranchId: string | null
  onSelectBranch: (id: string) => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (branches.length === 0) return null

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full px-3 py-1.5 group"
      >
        <span className="section-label">{label}</span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="text-[11px]">{branches.length}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          />
        </span>
      </button>

      {open && (
        <div className="space-y-0.5 px-2">
          {branches.map((b) => {
            const isActive = b._id === activeBranchId
            return (
              <button
                key={b._id}
                onClick={() => onSelectBranch(b._id)}
                className={`w-full text-left rounded-lg px-2 py-2 transition-colors duration-[120ms] group/row ${
                  isActive
                    ? 'bg-primary/8 border border-primary/20'
                    : 'hover:bg-muted border border-transparent'
                }`}
              >
                <div className="flex items-start gap-2">
                  <GitBranch
                    className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[12.5px] truncate leading-tight ${
                        isActive ? 'text-foreground font-medium' : 'text-foreground'
                      }`}
                    >
                      {b.branch_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={KIND_CHIP[b.kind] ?? 'chip'}>
                        {kindLabel(b.kind)}
                      </span>
                      {b.hasConflict && (
                        <span className="conflict-chip flex items-center gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          conflict
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                        {(b.github_author ?? '?')[0]?.toUpperCase()}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {b.github_author}
                      </span>
                      {b.last_synced_at && (
                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                          {timeAgo(b.last_synced_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function BranchSidebar({
  branches,
  activeBranchId,
  onSelectBranch,
  onSync,
  syncing,
}: BranchSidebarProps) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? branches.filter((b) =>
        b.branch_name.toLowerCase().includes(search.toLowerCase()) ||
        b.github_author.toLowerCase().includes(search.toLowerCase())
      )
    : branches

  const active   = filtered.filter((b) => b.status === 'active')
  const review   = filtered.filter((b) => b.status === 'review')
  const merged   = filtered.filter((b) => b.status === 'merged')
  const abandoned = filtered.filter((b) => b.status === 'abandoned')

  return (
    <aside className="w-72 shrink-0 flex flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <span className="text-[13px] font-semibold text-foreground">Branches</span>
          {branches.length > 0 && (
            <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {branches.length}
            </span>
          )}
        </div>
        <button
          onClick={onSync}
          disabled={syncing}
          className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          title="Sync from GitHub"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter branches…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="relay-input pl-8 h-8 text-[12.5px]"
          />
        </div>
      </div>

      {/* Branch groups */}
      <div className="flex-1 overflow-y-auto py-2 scroll-clean">
        {branches.length === 0 && !syncing ? (
          <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
            <GitBranch className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-[12.5px] text-muted-foreground">No branches yet.</p>
            <p className="text-[11.5px] text-muted-foreground mt-1">Connect a repo in Settings and click sync.</p>
            <button
              onClick={onSync}
              className="mt-3 btn-outline text-[12px] h-7 px-3"
            >
              Sync now
            </button>
          </div>
        ) : syncing && branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
            <RefreshCw className="h-5 w-5 text-primary animate-spin mb-2" />
            <p className="text-[12.5px] text-muted-foreground">Syncing from GitHub…</p>
          </div>
        ) : (
          <>
            <SectionGroup
              label="Active"
              branches={active}
              activeBranchId={activeBranchId}
              onSelectBranch={onSelectBranch}
              defaultOpen={true}
            />
            <SectionGroup
              label="In Review"
              branches={review}
              activeBranchId={activeBranchId}
              onSelectBranch={onSelectBranch}
              defaultOpen={true}
            />
            <SectionGroup
              label="Recently Merged"
              branches={merged}
              activeBranchId={activeBranchId}
              onSelectBranch={onSelectBranch}
              defaultOpen={false}
            />
            <SectionGroup
              label="Abandoned"
              branches={abandoned}
              activeBranchId={activeBranchId}
              onSelectBranch={onSelectBranch}
              defaultOpen={false}
            />
            {filtered.length === 0 && search && (
              <div className="px-4 py-6 text-center">
                <p className="text-[12.5px] text-muted-foreground">No branches match &ldquo;{search}&rdquo;</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer: conflict summary */}
      {branches.filter((b) => b.hasConflict).length > 0 && (
        <div className="px-4 py-2.5 border-t border-border flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-conflict shrink-0" />
          <span className="text-[11.5px] text-conflict font-medium">
            {branches.filter((b) => b.hasConflict).length} branch
            {branches.filter((b) => b.hasConflict).length !== 1 ? 'es have' : ' has'} conflicts
          </span>
        </div>
      )}
    </aside>
  )
}
