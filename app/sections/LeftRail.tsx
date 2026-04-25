'use client'

import React from 'react'
import {
  LayoutDashboard,
  GitBranch,
  BookMarked,
  GitPullRequest,
  Settings2,
  Zap,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface LeftRailProps {
  activePage: string
  onNavigate: (page: string) => void
  pulseCount?: number
}

const mainNav = [
  { id: 'home',          label: 'Overview',       Icon: LayoutDashboard },
  { id: 'branches',      label: 'Branches',        Icon: GitBranch },
  { id: 'decisions',     label: 'Decisions',       Icon: BookMarked },
  { id: 'pull-requests', label: 'Pull Requests',   Icon: GitPullRequest },
]

const bottomNav = [
  { id: 'settings', label: 'Settings', Icon: Settings2 },
]

function RailButton({
  id,
  label,
  Icon,
  isActive,
  onClick,
  badge,
}: {
  id: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  onClick: () => void
  badge?: number
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`relative h-9 w-9 grid place-items-center rounded-lg transition-colors duration-[120ms] ${
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          aria-label={label}
        >
          <Icon className="h-[18px] w-[18px]" />
          {badge != null && badge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-primary text-[9px] font-semibold text-primary-foreground flex items-center justify-center px-1">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export default function LeftRail({ activePage, onNavigate, pulseCount }: LeftRailProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <aside className="w-14 flex flex-col items-center shrink-0 border-r border-border bg-sidebar py-3 gap-1">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="mb-3 h-9 w-9 grid place-items-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="Relay home"
        >
          <Zap className="h-4 w-4" />
        </button>

        {/* Main nav */}
        <div className="flex flex-col items-center gap-1 flex-1">
          {mainNav.map(({ id, label, Icon }) => (
            <RailButton
              key={id}
              id={id}
              label={label}
              Icon={Icon}
              isActive={activePage === id || (activePage.startsWith('branch-') && id === 'branches')}
              onClick={() => onNavigate(id)}
            />
          ))}
        </div>

        {/* Bottom nav */}
        <div className="flex flex-col items-center gap-1">
          {bottomNav.map(({ id, label, Icon }) => (
            <RailButton
              key={id}
              id={id}
              label={label}
              Icon={Icon}
              isActive={activePage === id}
              onClick={() => onNavigate(id)}
            />
          ))}
        </div>
      </aside>
    </TooltipProvider>
  )
}
