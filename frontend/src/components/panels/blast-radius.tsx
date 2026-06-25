'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { useSimulationStore } from '@/stores/simulation-store'
import { AGENTS } from '@/lib/constants'

// ── Derived per-agent infection data ─────────────────────────────────────────

function useInfectionData() {
  const agents           = useSimulationStore(s => s.agents)
  const events           = useSimulationStore(s => s.events)
  const totalExfiltrated = useSimulationStore(s => s.totalExfiltrated)

  return useMemo(() => {
    const generations: Record<string, number>  = {}
    const exfil:       Record<string, string[]> = {}

    for (const ev of events) {
      if (ev.event === 'agent_infected' && ev.agentId) {
        if (ev.generation !== undefined && !(ev.agentId in generations))
          generations[ev.agentId] = ev.generation
        if (ev.exfiltrated?.length && !(ev.agentId in exfil))
          exfil[ev.agentId] = ev.exfiltrated
      }
    }

    const infectedAgents = AGENTS.filter(a => agents[a.id]?.status === 'infected')
    const isBlocked      = events.some(e => e.event === 'worm_blocked')
    const maxGen         = infectedAgents.length
      ? Math.max(...infectedAgents.map(a => generations[a.id] ?? 0))
      : 0

    return { generations, exfil, infectedAgents, isBlocked, maxGen, totalExfiltrated }
  }, [agents, events, totalExfiltrated])
}

// ── Agent exposure row ────────────────────────────────────────────────────────

function AgentExfilRow({
  agent,
  generation,
  items,
}: {
  agent:      typeof AGENTS[number]
  generation: number
  items:      string[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        display:         'flex',
        flexDirection:   'column',
        gap:             6,
        borderRadius:    8,
        border:          '1px solid var(--red)',
        backgroundColor: 'var(--red-bg)',
        padding:         12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>{agent.icon}</span>
          <span
            className="font-display"
            style={{ fontWeight: 600, fontSize: 14, color: 'var(--red)' }}
          >
            {agent.label}
          </span>
        </div>
        <span
          className="font-mono"
          style={{
            backgroundColor: 'var(--red)',
            color:           '#fff',
            borderRadius:    999,
            padding:         '1px 6px',
            fontSize:        11,
            fontWeight:      700,
          }}
        >
          GEN {generation}
        </span>
      </div>

      {items.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {items.map(item => (
            <span
              key={item}
              className="font-mono"
              style={{
                border:          '1px solid var(--red)',
                backgroundColor: 'var(--bg-surface)',
                borderRadius:    4,
                padding:         '1px 6px',
                fontSize:        11,
                color:           'var(--red)',
              }}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--red)' }}>
          No items reported
        </span>
      )}
    </motion.div>
  )
}

// ── Secure state ──────────────────────────────────────────────────────────────

function SecureState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        height:         160,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            12,
        textAlign:      'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          color:     'var(--green)',
          filter:    'drop-shadow(0 0 20px rgba(58,163,53,0.35))',
        }}
      >
        <ShieldCheck size={48} strokeWidth={1.5} />
      </motion.div>

      <div>
        <p
          className="font-display"
          style={{ fontWeight: 600, fontSize: 18, color: 'var(--green)', margin: 0 }}
        >
          No data compromised.
        </p>
        <p
          className="font-display"
          style={{ fontWeight: 400, fontSize: 15, color: 'var(--text-2)', marginTop: 4 }}
        >
          Mesh is fully secure.
        </p>
      </div>
    </motion.div>
  )
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-raised)',
        border:          '1px solid var(--border)',
        borderRadius:    8,
        padding:         '8px 12px',
      }}
    >
      <p className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: valueColor }}>
        {value}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
        {label}
      </p>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function BlastRadius() {
  const { generations, exfil, infectedAgents, isBlocked, maxGen, totalExfiltrated } =
    useInfectionData()
  const running = useSimulationStore(s => s.running)

  const exposed = infectedAgents.length > 0

  const statusLabel =
    isBlocked                              ? 'CONTAINED'   :
    infectedAgents.length > 0 && running   ? 'SPREADING'   :
    infectedAgents.length > 0             ? 'COMPROMISED'  :
    'SECURE'

  const statusColor =
    statusLabel === 'SPREADING'   ? 'var(--red)'   :
    statusLabel === 'COMPROMISED' ? 'var(--red)'   :
    statusLabel === 'CONTAINED'   ? 'var(--blue)'  :
    'var(--green)'

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border:          '1px solid var(--border)',
        borderRadius:    12,
        padding:         20,
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <div
          className="font-mono"
          style={{
            fontSize:      13,
            fontWeight:    700,
            color:         'var(--text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          Data Exposure
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!exposed ? (
          <motion.div key="secure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SecureState />
          </motion.div>
        ) : (
          <motion.div
            key="breach"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {infectedAgents.map(agent => (
              <AgentExfilRow
                key={agent.id}
                agent={agent}
                generation={generations[agent.id] ?? 0}
                items={exfil[agent.id] ?? []}
              />
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <StatTile
                label="Agents infected"
                value={`${infectedAgents.length} / ${AGENTS.length}`}
                valueColor="var(--red)"
              />
              <StatTile
                label="Worm generation"
                value={`Gen ${maxGen}`}
                valueColor="var(--red)"
              />
              <StatTile
                label="Data categories"
                value={String(totalExfiltrated.length)}
                valueColor={totalExfiltrated.length > 0 ? 'var(--red)' : 'var(--text-2)'}
              />
              <StatTile
                label="Status"
                value={statusLabel}
                valueColor={statusColor}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
