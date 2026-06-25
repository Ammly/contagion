'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulation-store'
import type { WorkflowEvent } from '@/types/events'

// ── Per-event-type colour ─────────────────────────────────────────────────────

function eventColor(type: WorkflowEvent['event']): string {
  switch (type) {
    case 'agent_infected': return 'var(--red)'
    case 'shield_alert':   return 'var(--red)'
    case 'worm_blocked':   return 'var(--blue)'
    case 'judge_allowed':  return 'var(--green)'
    case 'scan_complete':  return 'var(--green)'
    default:               return 'var(--text-2)'
  }
}

function eventWeight(type: WorkflowEvent['event']): number {
  return type === 'shield_alert' || type === 'scan_complete' ? 700 : 400
}

// ── Single event row ──────────────────────────────────────────────────────────

function EventRow({ event, isNewest }: { event: WorkflowEvent; isNewest: boolean }) {
  const ts = new Date(event.timestamp).toLocaleTimeString('en-KE', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        display:         'flex',
        alignItems:      'flex-start',
        gap:             8,
        paddingTop:      6,
        paddingBottom:   6,
        borderRadius:    6,
        backgroundColor: isNewest ? 'var(--bg-raised)' : 'transparent',
        transition:      'background-color 2s ease',
      }}
    >
      {/* Timestamp */}
      <span
        className="font-mono"
        style={{
          fontSize:   12,
          color:      'var(--text-3)',
          flexShrink: 0,
          paddingTop: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {ts}
      </span>

      {/* Separator */}
      <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0, paddingTop: 1 }}>
        —
      </span>

      {/* Message */}
      <span
        className="font-mono"
        style={{
          fontSize:    13,
          color:       eventColor(event.event),
          fontWeight:  eventWeight(event.event),
          lineHeight:  1.4,
          minWidth:    0,
        }}
      >
        {event.message}
      </span>
    </motion.div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '32px 16px',
        textAlign:      'center',
      }}
    >
      <p
        className="font-mono"
        style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}
      >
        Awaiting simulation…<br />
        Events will appear as the n8n workflow executes.
      </p>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function EventLog() {
  const events   = useSimulationStore(s => s.events)
  const listRef  = useRef<HTMLDivElement>(null)

  const visible  = events.filter(e => e.event !== 'reset')
  const newestId = visible[0]?.id ?? null

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [visible.length])

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border:          '1px solid var(--border)',
        borderRadius:    12,
        padding:         20,
        display:         'flex',
        flexDirection:   'column',
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   12,
          gap:            8,
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize:      13,
            fontWeight:    700,
            color:         'var(--text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            flexShrink:    0,
          }}
        >
          Event Log
        </span>
        <span
          className="font-mono"
          style={{
            fontSize:     11,
            color:        'var(--text-3)',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            textAlign:    'right',
          }}
        >
          Real-time callbacks from n8n online workflow executes.
        </span>
      </div>

      {/* ── Scrollable list ───────────────────────────────────────────── */}
      <div
        ref={listRef}
        style={{
          maxHeight:  320,
          overflowY:  'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border-bright) transparent',
        }}
      >
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence initial={false}>
            {visible.map(ev => (
              <EventRow key={ev.id} event={ev} isNewest={ev.id === newestId} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
