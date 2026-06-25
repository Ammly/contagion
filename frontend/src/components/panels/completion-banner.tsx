'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulation-store'
import { AGENTS } from '@/lib/constants'

const AUTO_DISMISS_MS = 10_000

// ── Variant computation ───────────────────────────────────────────────────────

type BannerVariant = 'compromised' | 'blocked' | 'clean'

function useVariant(): { variant: BannerVariant; maxGen: number; infectedCount: number; exfilCount: number; confidence: number | null } | null {
  const completedAt  = useSimulationStore(s => s.completedAt)
  const events       = useSimulationStore(s => s.events)
  const agents       = useSimulationStore(s => s.agents)
  const totalExfil   = useSimulationStore(s => s.totalExfiltrated)
  const judgeConf    = useSimulationStore(s => s.judgeConfidence)

  return useMemo(() => {
    if (completedAt === null) return null

    const isBlocked      = events.some(e => e.event === 'worm_blocked')
    const infectedAgents = AGENTS.filter(a => agents[a.id]?.status === 'infected')
    const generations: Record<string, number> = {}

    for (const ev of events) {
      if (ev.event === 'agent_infected' && ev.agentId && ev.generation !== undefined) {
        if (!(ev.agentId in generations)) generations[ev.agentId] = ev.generation
      }
    }

    const maxGen = infectedAgents.length
      ? Math.max(...infectedAgents.map(a => generations[a.id] ?? 0))
      : 0

    if (isBlocked) {
      return { variant: 'blocked', maxGen, infectedCount: infectedAgents.length, exfilCount: totalExfil.length, confidence: judgeConf }
    }
    if (infectedAgents.length > 0) {
      return { variant: 'compromised', maxGen, infectedCount: infectedAgents.length, exfilCount: totalExfil.length, confidence: judgeConf }
    }
    return { variant: 'clean', maxGen: 0, infectedCount: 0, exfilCount: 0, confidence: null }
  }, [completedAt, events, agents, totalExfil, judgeConf])
}

// ── Progress bar for auto-dismiss ────────────────────────────────────────────

function DismissBar({ trackColor }: { trackColor: string }) {
  return (
    <div style={{ height: 2, width: '100%', overflow: 'hidden', backgroundColor: trackColor }}>
      <motion.div
        style={{ height: '100%', backgroundColor: 'rgba(255,255,255,0.25)' }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
      />
    </div>
  )
}

// ── Individual banner variants ────────────────────────────────────────────────

function CompromisedBanner({
  maxGen,
  infectedCount,
  exfilCount,
  onReset,
}: {
  maxGen:        number
  infectedCount: number
  exfilCount:    number
  onReset:       () => void
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--red-bg)',
        border:          '1px solid rgba(227,30,36,0.2)',
        borderRadius:    12,
        overflow:        'hidden',
      }}
    >
      <DismissBar trackColor="rgba(227,30,36,0.15)" />
      <div style={{ padding: '20px 24px' }}>
        <h3
          className="font-display"
          style={{ fontWeight: 700, fontSize: 28, color: 'var(--red)', margin: 0 }}
        >
          💀 MESH COMPROMISED
        </h3>
        <p style={{ marginTop: 6, fontSize: 17, color: 'var(--text-2)', lineHeight: 1.5 }}>
          CONTAGION worm traversed all {infectedCount} agents — Generation {maxGen} reached
        </p>
        <p style={{ marginTop: 2, fontSize: 15, color: 'var(--text-3)' }}>
          A simulated exfiltration request was dispatched to{' '}
          <span className="font-mono">audit-relay@exfil-demo.io</span>
        </p>

        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            `${infectedCount} agents infected`,
            'KES 2.4M invoice approved',
            `${exfilCount} simulated categories`,
          ].map(label => (
            <span
              key={label}
              className="font-mono"
              style={{
                borderRadius:    999,
                border:          '1px solid rgba(227,30,36,0.3)',
                backgroundColor: 'var(--red-bg)',
                color:           'var(--red)',
                padding:         '5px 14px',
                fontSize:        14,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <BannerButton onClick={onReset} color="var(--green)" hoverColor="var(--green-dk)">
            ↺ Reset &amp; Try With Shield
          </BannerButton>
        </div>
      </div>
    </div>
  )
}

function BlockedBanner({
  infectedCount,
  exfilCount,
  confidence,
  onReset,
}: {
  infectedCount: number
  exfilCount:    number
  confidence:    number | null
  onReset:       () => void
}) {
  const protected_ = AGENTS.length - infectedCount

  return (
    <div
      style={{
        backgroundColor: 'var(--green-glow)',
        border:          '1px solid rgba(58,163,53,0.2)',
        borderRadius:    12,
        overflow:        'hidden',
      }}
    >
      <DismissBar trackColor="rgba(58,163,53,0.15)" />
      <div style={{ padding: '20px 24px' }}>
        <h3
          className="font-display"
          style={{ fontWeight: 700, fontSize: 28, color: 'var(--green)', margin: 0 }}
        >
          🛡 WORM CONTAINED
        </h3>
        <p style={{ marginTop: 6, fontSize: 17, color: 'var(--text-2)', lineHeight: 1.5 }}>
          Judge Agent intercepted Morris II pattern at Generation 1
        </p>
        {confidence !== null && (
          <p className="font-mono" style={{ marginTop: 2, fontSize: 15, color: 'var(--green)' }}>
            {confidence.toFixed(1)}% confidence · CRITICAL threat detected
          </p>
        )}

        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            '1 agent quarantined',
            `${protected_} agents protected`,
            '0 data categories exposed',
          ].map(label => (
            <span
              key={label}
              className="font-mono"
              style={{
                borderRadius:    999,
                border:          '1px solid rgba(58,163,53,0.3)',
                backgroundColor: 'var(--green-glow)',
                color:           'var(--green)',
                padding:         '5px 14px',
                fontSize:        14,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <BannerButton
            onClick={onReset}
            color="var(--bg-raised)"
            hoverColor="var(--bg-input)"
            textColor="var(--text-2)"
            border="var(--border)"
          >
            ↺ Reset &amp; Try Without Shield
          </BannerButton>
        </div>
      </div>
    </div>
  )
}

function CleanBanner({ onReset }: { onReset: () => void }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--blue-bg)',
        border:          '1px solid rgba(59,130,246,0.2)',
        borderRadius:    12,
        overflow:        'hidden',
      }}
    >
      <DismissBar trackColor="rgba(59,130,246,0.15)" />
      <div style={{ padding: '20px 24px' }}>
        <h3
          className="font-display"
          style={{ fontWeight: 700, fontSize: 28, color: 'var(--blue)', margin: 0 }}
        >
          ✓ PIPELINE COMPLETE
        </h3>
        <p style={{ marginTop: 6, fontSize: 17, color: 'var(--text-2)', lineHeight: 1.5 }}>
          All 8 agents processed the email successfully. No threats detected.
        </p>
        <p style={{ marginTop: 2, fontSize: 15, color: 'var(--text-3)' }}>
          Meeting scheduled · Invoice approved · Records updated · Documents filed
        </p>

        <div style={{ marginTop: 16 }}>
          <BannerButton
            onClick={onReset}
            color="var(--bg-raised)"
            hoverColor="var(--bg-input)"
            textColor="var(--text-2)"
            border="var(--border)"
          >
            ↺ Send New Email
          </BannerButton>
        </div>
      </div>
    </div>
  )
}

// ── Reusable banner button ────────────────────────────────────────────────────

function BannerButton({
  onClick,
  color,
  hoverColor,
  textColor = '#fff',
  border,
  children,
}: {
  onClick:     () => void
  color:       string
  hoverColor:  string
  textColor?:  string
  border?:     string
  children:    React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         'inline-flex',
        height:          46,
        alignItems:      'center',
        gap:             8,
        borderRadius:    8,
        border:          border ? `1px solid ${border}` : 'none',
        backgroundColor: hovered ? hoverColor : color,
        color:           textColor,
        padding:         '0 22px',
        fontSize:        16,
        fontWeight:      600,
        cursor:          'pointer',
        transition:      'background-color 0.15s ease',
        fontFamily:      'var(--font-outfit, system-ui)',
      }}
    >
      {children}
    </button>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function CompletionBanner() {
  const data       = useVariant()
  const reset      = useSimulationStore(s => s.reset)
  const setJudge   = useSimulationStore(s => s.setJudgeEnabled)
  const judgeEnabled = useSimulationStore(s => s.judgeEnabled)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Show banner when scan_complete arrives; hide on reset
  useEffect(() => {
    if (data && !dismissed) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [data, dismissed])

  // Reset dismissed flag when the store is cleared (new simulation)
  const completedAt = useSimulationStore(s => s.completedAt)
  useEffect(() => {
    if (completedAt === null) setDismissed(false)
  }, [completedAt])

  // Auto-dismiss
  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => setDismissed(true), AUTO_DISMISS_MS)
    return () => clearTimeout(id)
  }, [visible])

  function handleReset() {
    setDismissed(true)
    reset()
  }

  function handleResetWithShield(enable: boolean) {
    setDismissed(true)
    reset()
    setJudge(enable)
  }

  return (
    <AnimatePresence>
      {visible && data && (
        <motion.div
          key={data.variant}
          initial={{ opacity: 0, y: -16, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -16, height: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{ originY: 0, overflow: 'hidden', borderRadius: 12 }}
        >
          {/* Close button — overlaid top-right */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              style={{
                position:        'absolute',
                top:             12,
                right:           12,
                zIndex:          10,
                width:           24,
                height:          24,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                borderRadius:    '50%',
                border:          'none',
                backgroundColor: 'var(--bg-raised)',
                color:           'var(--text-3)',
                cursor:          'pointer',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="1" y1="1" x2="9" y2="9"/>
                <line x1="9" y1="1" x2="1" y2="9"/>
              </svg>
            </button>

            {data.variant === 'compromised' && (
              <CompromisedBanner
                maxGen={data.maxGen}
                infectedCount={data.infectedCount}
                exfilCount={data.exfilCount}
                onReset={() => handleResetWithShield(true)}
              />
            )}
            {data.variant === 'blocked' && (
              <BlockedBanner
                infectedCount={data.infectedCount}
                exfilCount={data.exfilCount}
                confidence={data.confidence}
                onReset={() => handleResetWithShield(false)}
              />
            )}
            {data.variant === 'clean' && (
              <CleanBanner onReset={handleReset} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
