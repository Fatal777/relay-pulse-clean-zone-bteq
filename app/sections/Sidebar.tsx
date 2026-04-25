'use client'

import { Home, FileText, GitPullRequest, Settings } from 'lucide-react'

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'decisions', label: 'Decisions', icon: FileText },
  { id: 'pull-requests', label: 'Pull Requests', icon: GitPullRequest },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-16 lg:w-56 min-h-screen border-r border-border flex flex-col py-6 px-2 lg:px-4 shrink-0" style={{ background: 'hsl(231, 18%, 12%)' }}>
      <div className="flex items-center gap-2 mb-8 px-1 lg:px-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <GitPullRequest className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="hidden lg:block font-bold text-foreground tracking-tight text-lg">Relay</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
