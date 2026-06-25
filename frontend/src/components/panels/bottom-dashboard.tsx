'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulation-store'
import { EventLog } from '@/components/event-log/event-log'
import { AGENTS } from '@/lib/constants'

export function BottomDashboard() {
  const selectedAgent = useSimulationStore(s => s.selectedAgent)
  const outcome = useSimulationStore(s => s.outcome)
  const startedAt = useSimulationStore(s => s.startedAt)
  const completedAt = useSimulationStore(s => s.completedAt)
  const agentsState = useSimulationStore(s => s.agents)

  // Hide entirely if detail panel is open
  if (selectedAgent) return null

  const duration = startedAt && completedAt ? ((completedAt - startedAt) / 1000).toFixed(1) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* ── PIPELINE SUMMARY STRIP ─────────────────────────────────────── */}
      <AnimatePresence>
        {outcome && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 4px', marginBottom: 8 }}>
              <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                PIPELINE COMPLETE in {duration}s
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {AGENTS.map(agent => {
                const st = agentsState[agent.id]
                const isClean = st?.status === 'clean'
                const isInfected = st?.status === 'infected'
                const isBlocked = st?.status === 'blocked'
                
                const borderColor = isInfected ? 'var(--red)' : isBlocked ? 'var(--blue)' : isClean ? 'var(--green)' : 'var(--border)'
                const bg = isInfected ? 'var(--red-bg)' : isBlocked ? 'var(--blue-bg)' : isClean ? 'var(--green-glow)' : 'var(--bg-raised)'
                
                return (
                  <div
                    key={agent.id}
                    title={st?.summary || agent.role}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: bg, border: `1px solid ${borderColor}`,
                      padding: '4px 8px', borderRadius: 6,
                      minWidth: 0, flexShrink: 0, maxWidth: 140
                    }}
                  >
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{agent.icon}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st?.summary || agent.role}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EVENT LOG ──────────────────────────────────────────────── */}
      <div>
        <EventLog />
      </div>
      
    </div>
  )
}
