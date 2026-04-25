'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Zap, ChevronRight, GitCommit, GitPullRequest, BookMarked, AlertTriangle, UserPlus, Sparkles } from 'lucide-react'

export interface PulseEvent {
  _id: string
  kind: 'commit' | 'pr_opened' | 'decision_saved' | 'conflict_detected' | 'member_joined' | 'review_generated' | 'branch_synced' | 'status_changed'
  branch_id?: string
  branch_name?: string
  actor: { name: string; github_username?: string }
  payload: Record<string, unknown>
  created_at: string
}

interface PulsePanelProps {
  events: PulseEvent[]
  newCount: number
  onClearNew: () => void
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60)  return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const EVENT_ICONS: Record<PulseEvent['kind'], React.ComponentType<{ className?: string }>> = {
  commit:           GitCommit,
  pr_opened:        GitPullRequest,
  decision_saved:   BookMarked,
  conflict_detected: AlertTriangle,
  member_joined:    UserPlus,
  review_generated: Sparkles,
  branch_synced:    GitCommit,
  status_changed:   GitCommit,
}

const EVENT_COLORS: Record<PulseEvent['kind'], string> = {
  commit:           'text-primary bg-primary/10',
  pr_opened:        'text-safe bg-safe/10',
  decision_saved:   'text-[hsl(var(--refactor))] bg-[hsl(var(--refactor-soft))]',
  conflict_detected:'text-conflict bg-conflict/10',
  member_joined:    'text-[hsl(var(--pending))] bg-[hsl(var(--pending-soft))]',
  review_generated: 'text-primary bg-primary/10',
  branch_synced:    'text-muted-foreground bg-muted',
  status_changed:   'text-muted-foreground bg-muted',
}

function eventDescription(e: PulseEvent): string {
  const p = e.payload as Record<string, string>
  switch (e.kind) {
    case 'commit':           return p.message ? `pushed: ${p.message}` : 'pushed a commit'
    case 'pr_opened':        return p.title   ? `opened PR: ${p.title}` : 'opened a pull request'
    case 'decision_saved':   return p.text    ? `saved decision: ${p.text}` : 'saved a decision'
    case 'conflict_detected':return p.file    ? `conflict in ${p.file}` : 'conflict detected'
    case 'member_joined':    return `joined branch session`
    case 'review_generated': return `generated PR review`
    case 'branch_synced':    return `synced branch`
    case 'status_changed':   return p.status  ? `moved to ${p.status}` : 'status changed'
    default:                 return 'activity'
  }
}

function EventRow({ event, isNew }: { event: PulseEvent; isNew: boolean }) {
  const Icon = EVENT_ICONS[event.kind] ?? GitCommit
  const colorCls = EVENT_COLORS[event.kind] ?? 'text-muted-foreground bg-muted'

  return (
    <div className={`flex items-start gap-2.5 py-2.5 px-3 border-b border-border/60 last:border-0 ${isNew ? 'fade-in-up' : ''}`}>
      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${colorCls}`}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[12px] font-medium text-foreground">{event.actor.name}</span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(event.created_at)}</span>
        </div>
        <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
          {eventDescription(event)}
        </p>
        {event.branch_name && (
          <span className="filepath mt-0.5 inline-block">{event.branch_name}</span>
        )}
      </div>
    </div>
  )
}

export default function PulsePanel({ events, newCount, onClearNew }: PulsePanelProps) {
  const [expanded, setExpanded] = useState(false)
  const prevCountRef = useRef(events.length)
  const newEventIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (events.length > prevCountRef.current) {
      const added = events.slice(0, events.length - prevCountRef.current)
      added.forEach((e) => newEventIds.current.add(e._id))
      // Clear "new" marker after animation
      setTimeout(() => {
        added.forEach((e) => newEventIds.current.delete(e._id))
      }, 600)
    }
    prevCountRef.current = events.length
  }, [events])

  return (
    <aside
      className={`shrink-0 flex flex-col border-l border-border bg-background transition-all duration-[200ms] ${
        expanded ? 'w-72' : 'w-11'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => {
          setExpanded((p) => !p)
          if (!expanded) onClearNew()
        }}
        className="h-11 w-11 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors border-b border-border relative"
        title={expanded ? 'Collapse pulse' : 'Expand pulse'}
      >
        {expanded ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <Zap className="h-4 w-4" />
            {newCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-3.5 min-w-3.5 rounded-full bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center px-0.5">
                {newCount > 9 ? '9+' : newCount}
              </span>
            )}
          </>
        )}
      </button>

      {expanded && (
        <>
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-[12.5px] font-semibold text-foreground">Team Pulse</span>
            </div>
            {events.length > 0 && (
              <span className="text-[10.5px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {events.length}
              </span>
            )}
          </div>

          {/* Live indicator */}
          <div className="px-3 py-1.5 border-b border-border flex items-center gap-1.5">
            <span className="pulse-dot" />
            <span className="text-[11px] text-muted-foreground">Live — updates every 8s</span>
          </div>

          {/* Events */}
          <div className="flex-1 overflow-y-auto scroll-clean">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
                <Zap className="h-6 w-6 text-muted-foreground/30 mb-2" />
                <p className="text-[12px] text-muted-foreground">No activity yet.</p>
                <p className="text-[11px] text-muted-foreground mt-1">Actions will appear here in real time.</p>
              </div>
            ) : (
              events.map((e) => (
                <EventRow
                  key={e._id}
                  event={e}
                  isNew={newEventIds.current.has(e._id)}
                />
              ))
            )}
          </div>
        </>
      )}
    </aside>
  )
}
