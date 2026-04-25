'use client'

import { useState } from 'react'
import { Activity, Send, GitBranch, User, Clock, AlertTriangle, Info, AlertCircle } from 'lucide-react'

interface PulseEvent {
  _id?: string
  branch_id: string
  branch_name: string
  event_type: string
  message: string
  author?: string
  severity?: string
  metadata?: Record<string, any>
  createdAt?: string
}

interface PulsePanelProps {
  events: PulseEvent[]
  branchId?: string | null
  branchName?: string
  onAddEvent?: (event: { branch_id: string; branch_name: string; event_type: string; message: string; author: string; severity: string }) => void
  loading?: boolean
}

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'warning':
      return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
    case 'error':
      return <AlertCircle className="w-3.5 h-3.5 text-red-400" />
    default:
      return <Info className="w-3.5 h-3.5 text-blue-400" />
  }
}

function EventTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    join: 'bg-green-500/15 text-green-400 border-green-500/20',
    handoff: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    note: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    commit: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    conflict: 'bg-red-500/15 text-red-400 border-red-500/20',
    review: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  }
  const cls = colors[type] || 'bg-muted text-muted-foreground border-border'
  return (
    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${cls}`}>
      {type}
    </span>
  )
}

export default function PulsePanel({ events, branchId, branchName, onAddEvent, loading }: PulsePanelProps) {
  const [message, setMessage] = useState('')
  const [author, setAuthor] = useState('')

  const handleSend = () => {
    if (!message.trim() || !branchId || !onAddEvent) return
    onAddEvent({
      branch_id: branchId,
      branch_name: branchName || '',
      event_type: 'note',
      message: message.trim(),
      author: author.trim() || 'Anonymous',
      severity: 'info',
    })
    setMessage('')
  }

  const displayEvents = branchId ? events.filter((e) => e.branch_id === branchId) : events

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Pulse Feed
          {branchName && <span className="text-xs text-muted-foreground font-normal">/ {branchName}</span>}
        </h2>
        <span className="text-xs text-muted-foreground">{displayEvents.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && displayEvents.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No pulse events yet</p>
        )}
        {displayEvents.map((event) => (
          <div
            key={event._id}
            className="p-3 rounded-xl bg-card/50 border border-border hover:border-border/80 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <SeverityIcon severity={event.severity || 'info'} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <EventTypeBadge type={event.event_type} />
                  {event.branch_name && !branchId && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <GitBranch className="w-3 h-3" />
                      {event.branch_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground leading-relaxed">{event.message}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {event.author && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <User className="w-3 h-3" />
                      {event.author}
                    </span>
                  )}
                  {event.createdAt && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {branchId && onAddEvent && (
        <div className="p-3 border-t border-border space-y-2">
          <input
            type="text"
            placeholder="Your name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a pulse note..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
