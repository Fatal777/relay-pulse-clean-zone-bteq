'use client'

import { useState } from 'react'
import { GitBranch, Plus, Trash2, User, Clock, File, Search } from 'lucide-react'

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

interface BranchSidebarProps {
  branches: Branch[]
  selectedBranchId: string | null
  onSelectBranch: (id: string) => void
  onCreateBranch: (branch: Partial<Branch>) => void
  onDeleteBranch: (id: string) => void
  repoOwner: string
  repoName: string
  loading?: boolean
}

export default function BranchSidebar({
  branches,
  selectedBranchId,
  onSelectBranch,
  onCreateBranch,
  onDeleteBranch,
  repoOwner,
  repoName,
  loading,
}: BranchSidebarProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [search, setSearch] = useState('')

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.author || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = () => {
    if (!newName.trim()) return
    onCreateBranch({
      name: newName.trim(),
      repo_owner: repoOwner,
      repo_name: repoName,
      description: newDesc.trim(),
      status: 'active',
    })
    setNewName('')
    setNewDesc('')
    setShowCreate(false)
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          Branches
          <span className="text-xs text-muted-foreground">({branches.length})</span>
        </h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showCreate && (
        <div className="p-3 border-b border-border space-y-2 bg-card/50">
          <input
            type="text"
            placeholder="Branch name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter branches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No branches found</p>
        )}
        {filtered.map((branch) => {
          const isSelected = selectedBranchId === branch._id
          return (
            <button
              key={branch._id}
              onClick={() => branch._id && onSelectBranch(branch._id)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                isSelected
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-secondary/40 border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {branch.name}
                  </p>
                  {branch.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{branch.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {branch.author && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <User className="w-3 h-3" />
                        {branch.author}
                      </span>
                    )}
                    {(branch.files_changed?.length || 0) > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <File className="w-3 h-3" />
                        {branch.files_changed?.length}
                      </span>
                    )}
                    {branch.last_commit_date && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(branch.last_commit_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${branch.status === 'active' ? 'bg-green-400' : 'bg-muted-foreground/40'}`} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (branch._id) onDeleteBranch(branch._id)
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
