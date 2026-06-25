'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulation-store'

const AGENT_COLORS: Record<string, string> = {
  email: '#0d9488',    // teal
  calendar: '#4f46e5', // indigo
  code: '#475569',     // slate
  finance: '#d97706',  // amber
  hr: '#e11d48',       // rose
  crm: '#7c3aed',      // violet
  search: '#0284c7',   // sky
  file: '#059669',     // emerald
  system: '#52525b'    // grey
}

function getEventColor(type: string) {
  switch (type) {
    case 'agent_processing': return '#1e293b'
    case 'agent_infected': return '#dc2626'
    case 'shield_alert':
    case 'worm_blocked': return '#dc2626'
    case 'judge_allowed': return '#006c49'
    case 'scan_complete': return '#006c49'
    case 'simulation_start': return '#64748b'
    default: return '#64748b'
  }
}

function getEventWeight(type: string) {
  return ['shield_alert', 'worm_blocked', 'scan_complete'].includes(type) ? 700 : 400
}

function getEventStyle(type: string) {
  if (type === 'simulation_start') return 'italic'
  return 'normal'
}

export function EventLog() {
  const events = useSimulationStore(s => s.events)
  const listRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const visible = events.filter(e => e.event !== 'reset')

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [visible.length, autoScroll])

  function handleScroll() {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    const isBottom = scrollHeight - scrollTop - clientHeight < 10
    setAutoScroll(isBottom)
  }

  return (
    <div style={{ background: 'white', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 300, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 className="font-mono" style={{ fontSize: 17, fontWeight: 700, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
            Event Log
          </h3>
          <p style={{ fontSize: 15, color: '#94a3b8', margin: '2px 0 0' }}>Real-time callbacks from n8n workflow executions</p>
        </div>
        <span className="font-mono" style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
          {visible.length} events
        </span>
      </div>

      {/* Container */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          height: 280, overflowY: 'auto', position: 'relative', scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent',
          background: '#f8fafc', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0'
        }}
      >
        {visible.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p className="font-mono" style={{ fontSize: 16, color: '#94a3b8' }}>
              Awaiting simulation... Events will appear as the n8n workflow executes.
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ marginLeft: 4 }}>▋</motion.span>
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {visible.map((ev, i) => {
              const ts = new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })
              const pillBg = AGENT_COLORS[ev.agentId ?? 'system'] || AGENT_COLORS.system
              const color = getEventColor(ev.event)
              const weight = getEventWeight(ev.event)
              const fontStyle = getEventStyle(ev.event)

              return (
                <div key={ev.id + '-' + i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span className="font-mono" style={{ fontSize: 15, color: '#94a3b8', width: 110, flexShrink: 0, marginTop: 1 }}>
                    {ts}
                  </span>
                  <span className="font-mono" style={{
                    background: pillBg, color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 999,
                    width: 72, flexShrink: 0, textAlign: 'center', padding: '4px 0', textTransform: 'uppercase', marginTop: 1
                  }}>
                    {ev.agentId ? ev.agentId.substring(0,6) : 'SYS'}
                  </span>
                  <span style={{
                    fontSize: 17, fontFamily: 'Outfit, sans-serif', fontWeight: weight, fontStyle, color, lineHeight: 1.5, wordBreak: 'break-word'
                  }}>
                    {ev.message}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Auto-scroll badge */}
      <AnimatePresence>
        {!autoScroll && visible.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            onClick={() => { setAutoScroll(true); listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) }}
            style={{
              position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
              background: '#006c49', color: '#fff', border: 'none', borderRadius: 999, padding: '4px 12px',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 10
            }}
          >
            ↓ New events
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
