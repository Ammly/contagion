'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ShieldAlert, ShieldX, Siren, Activity } from 'lucide-react'
import { useSimulationStore } from '@/stores/simulation-store'
import type { SimulationEvent } from '@/types/events'

const F    = '"Manrope", system-ui, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'

// ── Notification types ────────────────────────────────────────────────────────

type NotifVariant = 'running' | 'infected' | 'blocked' | 'clean' | 'compromised'

interface Notif {
  id:       string
  variant:  NotifVariant
  title:    string
  body:     string
  ttl?:     number   // ms before auto-dismiss; undefined = sticky until next
}

const VARIANTS: Record<NotifVariant, {
  icon:    React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  accent:  string
  bg:      string
  border:  string
}> = {
  running:     { icon: Activity,    accent: '#006c49', bg: '#f0faf4', border: 'rgba(0,108,73,0.18)'   },
  infected:    { icon: ShieldAlert, accent: '#dc2626', bg: '#fff1f1', border: 'rgba(220,38,38,0.2)'   },
  blocked:     { icon: ShieldX,     accent: '#2563eb', bg: '#eff6ff', border: 'rgba(37,99,235,0.2)'   },
  clean:       { icon: ShieldCheck, accent: '#006c49', bg: '#f0faf4', border: 'rgba(0,108,73,0.18)'   },
  compromised: { icon: Siren,       accent: '#dc2626', bg: '#fff1f1', border: 'rgba(220,38,38,0.2)'   },
}

// ── Derive a notification from a store snapshot ───────────────────────────────

function makeNotif(event: SimulationEvent, infectedCount: number, exfilCount: number): Notif | null {
  switch (event.event) {
    case 'simulation_start':
      return {
        id:      event.id,
        variant: 'running',
        title:   'Security Posture',
        body:    'Monitoring 8 agents — no threats detected.',
        ttl:     4_000,
      }
    case 'agent_infected':
      return {
        id:      event.id,
        variant: 'infected',
        title:   'Agent Compromised',
        body:    `${infectedCount} of 8 agents infected (Gen ${event.generation ?? '?'}).`,
      }
    case 'worm_blocked':
      return {
        id:      event.id,
        variant: 'blocked',
        title:   'Threat Neutralised',
        body:    'Worm blocked by Judge Agent. No agents processed the payload.',
        ttl:     8_000,
      }
    case 'scan_complete':
      if (event.wormFound) {
        return {
          id:      event.id,
          variant: 'compromised',
          title:   'Pipeline Compromised',
          body:    `${exfilCount} data categor${exfilCount === 1 ? 'y' : 'ies'} exposed.`,
          ttl:     10_000,
        }
      }
      return {
        id:      event.id,
        variant: 'clean',
        title:   'Security Posture',
        body:    'No data compromised — pipeline clean.',
        ttl:     8_000,
      }
    default:
      return null
  }
}

// ── Single notification card ──────────────────────────────────────────────────

function NotifCard({ notif, onDismiss }: { notif: Notif; onDismiss: () => void }) {
  const v       = VARIANTS[notif.variant]
  const Icon    = v.icon
  const isPulse = notif.variant === 'infected' || notif.variant === 'compromised'

  // Progress bar for auto-dismiss
  const hasTtl = notif.ttl !== undefined

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.94 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{
        background:    v.bg,
        border:        `1px solid ${v.border}`,
        borderRadius:  14,
        overflow:      'hidden',
        width:         360,
        boxShadow:     '0 4px 20px rgba(0,0,0,0.10)',
        fontFamily:    F,
        cursor:        'pointer',
      }}
      onClick={onDismiss}
    >
      {/* Auto-dismiss progress bar */}
      {hasTtl && (
        <motion.div
          style={{ height: 2, background: v.accent, transformOrigin: 'left' }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: (notif.ttl ?? 4000) / 1000, ease: 'linear' }}
        />
      )}

      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div
          style={{
            width:          46,
            height:         46,
            borderRadius:   '50%',
            background:     `${v.accent}18`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            animation:      isPulse ? 'pulse-red 2s ease-in-out infinite' : undefined,
          }}
        >
          <Icon size={22} color={v.accent} strokeWidth={1.8} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize:      13,
              fontWeight:    700,
              color:         v.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom:  3,
              fontFamily:    MONO,
            }}
          >
            {notif.title}
          </p>
          <p style={{ fontSize: 16, color: '#334155', lineHeight: 1.4, margin: 0 }}>
            {notif.body}
          </p>
        </div>

        {/* Dismiss × */}
        <button
          onClick={e => { e.stopPropagation(); onDismiss() }}
          style={{
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            color:      '#94a3b8',
            padding:    2,
            flexShrink: 0,
            lineHeight: 1,
            fontSize:   14,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function DataExposure() {
  const events          = useSimulationStore(s => s.events)
  const totalExfiltrated = useSimulationStore(s => s.totalExfiltrated)
  const infectedAgents  = useSimulationStore(s => s.infectedAgents)
  const completedAt     = useSimulationStore(s => s.completedAt)

  const [notif, setNotif]     = useState<Notif | null>(null)
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastEventIdRef        = useRef<string | null>(null)

  // Clear notification on reset (completedAt goes null)
  useEffect(() => {
    if (completedAt === null) {
      setNotif(null)
      lastEventIdRef.current = null
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [completedAt])

  // React to new events (events[0] is always the newest)
  useEffect(() => {
    const latest = events[0]
    if (!latest) return
    if (latest.id === lastEventIdRef.current) return

    const candidate = makeNotif(latest, infectedAgents.length, totalExfiltrated.length)
    if (!candidate) return

    lastEventIdRef.current = latest.id

    // Cancel any pending auto-dismiss from the previous notification
    if (timerRef.current) clearTimeout(timerRef.current)

    setNotif(candidate)

    if (candidate.ttl !== undefined) {
      timerRef.current = setTimeout(() => setNotif(null), candidate.ttl)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setNotif(null)
  }

  return (
    <div
      style={{
        position:  'fixed',
        top:       80,   // 64px nav + 16px gap
        right:     24,
        zIndex:    60,
        display:   'flex',
        flexDirection: 'column',
        gap:       10,
        pointerEvents: notif ? 'auto' : 'none',
      }}
    >
      <AnimatePresence mode="wait">
        {notif && (
          <NotifCard key={notif.id} notif={notif} onDismiss={dismiss} />
        )}
      </AnimatePresence>
    </div>
  )
}
