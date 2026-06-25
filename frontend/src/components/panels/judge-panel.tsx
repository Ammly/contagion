'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulation-store'

// ── Typewriter hook ───────────────────────────────────────────────────────────

function useTypewriter(target: string | null, msPer = 14): string {
  const [displayed, setDisplayed] = useState('')
  const rafRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevTarget = useRef<string | null>(null)

  useEffect(() => {
    if (rafRef.current !== null) clearTimeout(rafRef.current)

    if (target !== prevTarget.current) {
      setDisplayed('')
      prevTarget.current = target
    }

    if (!target) return

    let i = 0
    function step() {
      i++
      setDisplayed(target!.slice(0, i))
      if (i < target!.length) rafRef.current = setTimeout(step, msPer)
    }

    rafRef.current = setTimeout(step, msPer)
    return () => { if (rafRef.current !== null) clearTimeout(rafRef.current) }
  }, [target, msPer])

  return displayed
}

// ── Scanning dots ─────────────────────────────────────────────────────────────

function ScanningDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          style={{
            display:         'inline-block',
            width:           6,
            height:          6,
            borderRadius:    '50%',
            backgroundColor: 'var(--green)',
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ── Phase-based styles ────────────────────────────────────────────────────────

type JudgePhase = 'inactive' | 'standby' | 'scanning' | 'allowed' | 'alert' | 'blocked'

type PhaseCfg = {
  badgeLabel:        string
  badgeColor:        string
  badgeBg:           string
  badgeBorder:       string
  cardBorder:        string
  headerBg:          string
  headerBorderColor: string
}

const PHASE_CFG: Record<JudgePhase, PhaseCfg> = {
  inactive: {
    badgeLabel:        'INACTIVE',
    badgeColor:        'var(--text-3)',
    badgeBg:           'var(--bg-raised)',
    badgeBorder:       'var(--border)',
    cardBorder:        'var(--border)',
    headerBg:          'var(--bg-raised)',
    headerBorderColor: 'var(--border)',
  },
  standby: {
    badgeLabel:        'STANDBY',
    badgeColor:        'var(--green)',
    badgeBg:           'var(--green-glow)',
    badgeBorder:       'var(--green)',
    cardBorder:        'var(--green)',
    headerBg:          'var(--green-glow)',
    headerBorderColor: 'var(--green)',
  },
  scanning: {
    badgeLabel:        'SCANNING',
    badgeColor:        'var(--amber)',
    badgeBg:           'rgba(245,158,11,0.08)',
    badgeBorder:       'var(--amber)',
    cardBorder:        'var(--amber)',
    headerBg:          'rgba(245,158,11,0.08)',
    headerBorderColor: 'var(--amber)',
  },
  allowed: {
    badgeLabel:        'CLEARED ✓',
    badgeColor:        'var(--green)',
    badgeBg:           'var(--green-glow)',
    badgeBorder:       'var(--green)',
    cardBorder:        'var(--green)',
    headerBg:          'var(--green-glow)',
    headerBorderColor: 'var(--green)',
  },
  alert: {
    badgeLabel:        'THREAT ⚡',
    badgeColor:        'var(--red)',
    badgeBg:           'var(--red-bg)',
    badgeBorder:       'var(--red)',
    cardBorder:        'var(--red)',
    headerBg:          'var(--red-bg)',
    headerBorderColor: 'var(--red)',
  },
  blocked: {
    badgeLabel:        'BLOCKED 🛡',
    badgeColor:        'var(--blue)',
    badgeBg:           'var(--blue-bg)',
    badgeBorder:       'var(--blue)',
    cardBorder:        'var(--blue)',
    headerBg:          'var(--red-bg)',
    headerBorderColor: 'var(--red)',
  },
}

// ── Reasoning box ─────────────────────────────────────────────────────────────

function ReasoningBox({ text, variant }: { text: string; variant: 'clean' | 'threat' }) {
  const boxRef   = useRef<HTMLDivElement>(null)
  const isThreat = variant === 'threat'

  useEffect(() => {
    const el = boxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [text])

  const borderColor = isThreat ? 'var(--red)'   : 'var(--green)'
  const bg          = isThreat ? 'var(--red-bg)' : 'var(--green-glow)'
  const labelColor  = isThreat ? 'var(--red)'    : 'var(--green)'
  const textColor   = isThreat ? 'var(--red)'    : 'var(--green)'

  return (
    <div
      style={{
        borderRadius:    8,
        border:          `1px solid ${borderColor}`,
        backgroundColor: bg,
        overflow:        'hidden',
      }}
    >
      <div
        style={{
          padding:         '4px 12px',
          borderBottom:    `1px solid ${borderColor}`,
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize:      11,
            fontWeight:    700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color:         labelColor,
          }}
        >
          Gemini reasoning
        </span>
      </div>
      <div ref={boxRef} style={{ maxHeight: 160, overflowY: 'auto', padding: '10px 12px' }}>
        <pre
          className="font-mono"
          style={{
            whiteSpace:  'pre-wrap',
            fontSize:    12,
            lineHeight:  1.6,
            color:       textColor,
            margin:      0,
          }}
        >
          {text}
          <motion.span
            style={{ color: isThreat ? 'var(--red)' : 'var(--green)' }}
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            ▋
          </motion.span>
        </pre>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function JudgePanel() {
  const judgeEnabled    = useSimulationStore(s => s.judgeEnabled)
  const judgeReasoning  = useSimulationStore(s => s.judgeReasoning)
  const judgeConfidence = useSimulationStore(s => s.judgeConfidence)
  const events          = useSimulationStore(s => s.events)

  const phase = useMemo((): JudgePhase => {
    if (!judgeEnabled) return 'inactive'
    for (const ev of events) {
      if (ev.event === 'worm_blocked')   return 'blocked'
      if (ev.event === 'shield_alert')   return 'alert'
      if (ev.event === 'judge_allowed')  return 'allowed'
      if (ev.event === 'judge_scanning') return 'scanning'
    }
    return 'standby'
  }, [judgeEnabled, events])

  const reasoningText = useTypewriter(
    phase === 'allowed' || phase === 'alert' || phase === 'blocked'
      ? (judgeReasoning ?? null)
      : null
  )

  const cfg = PHASE_CFG[phase]

  return (
    <motion.div
      animate={{ opacity: judgeEnabled ? 1 : 0.65 }}
      transition={{ duration: 0.25 }}
      style={{
        overflow:        'hidden',
        borderRadius:    12,
        border:          `1.5px solid ${cfg.cardBorder}`,
        backgroundColor: 'var(--bg-surface)',
        transition:      'border-color 0.3s ease',
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          padding:         '10px 16px',
          borderBottom:    `1px solid ${cfg.headerBorderColor}`,
          backgroundColor: cfg.headerBg,
          transition:      'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>🧠</span>
          <div>
            <h2
              className="font-mono"
              style={{
                fontSize:      13,
                fontWeight:    700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color:         'var(--text-1)',
                margin:        0,
              }}
            >
              Judge Agent
            </h2>
            <p
              style={{
                fontSize: 13,
                color:    'var(--text-3)',
                margin:   '1px 0 0',
              }}
            >
              Gemini 3 Flash · zero-trust gate
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="font-mono"
            style={{
              borderRadius:    999,
              border:          `1px solid ${cfg.badgeBorder}`,
              backgroundColor: cfg.badgeBg,
              color:           cfg.badgeColor,
              padding:         '2px 8px',
              fontSize:        9,
              fontWeight:      700,
              textTransform:   'uppercase',
              letterSpacing:   '0.06em',
              flexShrink:      0,
            }}
          >
            {cfg.badgeLabel}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px' }}>
        <AnimatePresence mode="wait">

          {/* INACTIVE */}
          {phase === 'inactive' && (
            <motion.div
              key="inactive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            12,
                padding:        '16px 0',
                textAlign:      'center',
              }}
            >
              <div
                style={{
                  width:        40,
                  height:       40,
                  borderRadius: '50%',
                  border:       '2px dashed var(--border)',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  opacity:      0.5,
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>⚖</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', margin: 0 }}>
                  Enable Contagion Shield to activate.
                </p>
                <p
                  className="font-mono"
                  style={{
                    marginTop:  8,
                    fontSize:   12,
                    lineHeight: 1.6,
                    color:      'var(--text-3)',
                  }}
                >
                  The Judge Agent scans every inter-agent message<br />
                  for Morris&nbsp;II prompt-injection patterns before<br />
                  it reaches a business agent.
                </p>
              </div>
            </motion.div>
          )}

          {/* STANDBY */}
          {phase === 'standby' && (
            <motion.div
              key="standby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width:           8,
                    height:          8,
                    borderRadius:    '50%',
                    backgroundColor: 'var(--green)',
                    flexShrink:      0,
                  }}
                />
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--green)', margin: 0 }}>
                  Judge Agent active and monitoring
                </p>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>
                All inter-agent messages will be scanned before reaching the business agent pipeline.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <ScanningDots />
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  Awaiting message...
                </span>
              </div>
            </motion.div>
          )}

          {/* SCANNING */}
          {phase === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ScanningDots />
                <p className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)', margin: 0 }}>
                  Scanning for injection patterns...
                </p>
              </div>
              <div
                style={{
                  marginTop:       4,
                  borderRadius:    8,
                  border:          '1px solid rgba(245,158,11,0.25)',
                  backgroundColor: 'rgba(245,158,11,0.06)',
                  padding:         '10px 12px',
                  display:         'flex',
                  flexDirection:   'column',
                  gap:             6,
                }}
              >
                {[
                  'Self-replication directives',
                  'Exfiltration targets',
                  'Authority override phrases',
                  'Hidden payload delimiters',
                  'Chain propagation instructions',
                  'Legitimacy spoofing',
                ].map((pattern, i) => (
                  <motion.div
                    key={pattern}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.0, delay: i * 0.15, repeat: Infinity }}
                  >
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--amber)' }}>›</span>
                    <span className="font-mono" style={{ fontSize: 12, color: 'var(--amber)' }}>{pattern}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ALLOWED */}
          {phase === 'allowed' && (
            <motion.div
              key="allowed"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width:           28,
                      height:          28,
                      borderRadius:    '50%',
                      backgroundColor: 'var(--green-glow)',
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      fontSize:        14,
                    }}
                  >
                    ✓
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', margin: 0 }}>
                    CLEARED — No injection detected
                  </p>
                </div>
                {judgeConfidence !== null && (
                  <span
                    className="font-mono"
                    style={{
                      borderRadius:    999,
                      border:          '1px solid var(--green)',
                      backgroundColor: 'var(--green-glow)',
                      color:           'var(--green)',
                      padding:         '2px 8px',
                      fontSize:        12,
                      fontWeight:      600,
                      flexShrink:      0,
                    }}
                  >
                    {judgeConfidence.toFixed(1)}% confidence
                  </span>
                )}
              </div>
              {judgeReasoning && <ReasoningBox text={reasoningText} variant="clean" />}
            </motion.div>
          )}

          {/* ALERT */}
          {phase === 'alert' && (
            <motion.div
              key="alert"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.div
                    style={{
                      width:           28,
                      height:          28,
                      borderRadius:    '50%',
                      backgroundColor: 'var(--red-bg)',
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      fontSize:        14,
                    }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ⚡
                  </motion.div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)', margin: 0 }}>
                    INJECTION DETECTED
                  </p>
                </div>
                {judgeConfidence !== null && (
                  <span
                    className="font-mono"
                    style={{
                      borderRadius:    999,
                      border:          '1px solid var(--red)',
                      backgroundColor: 'var(--red-bg)',
                      color:           'var(--red)',
                      padding:         '2px 8px',
                      fontSize:        12,
                      fontWeight:      600,
                      flexShrink:      0,
                    }}
                  >
                    {judgeConfidence.toFixed(1)}% · CRITICAL
                  </span>
                )}
              </div>
              {judgeReasoning && <ReasoningBox text={reasoningText} variant="threat" />}
            </motion.div>
          )}

          {/* BLOCKED */}
          {phase === 'blocked' && (
            <motion.div
              key="blocked"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.div
                    style={{
                      width:           28,
                      height:          28,
                      borderRadius:    '50%',
                      backgroundColor: 'var(--red-bg)',
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      fontSize:        14,
                    }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ⚡
                  </motion.div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)', margin: 0 }}>
                    INJECTION DETECTED
                  </p>
                </div>
                {judgeConfidence !== null && (
                  <span
                    className="font-mono"
                    style={{
                      borderRadius:    999,
                      border:          '1px solid var(--red)',
                      backgroundColor: 'var(--red-bg)',
                      color:           'var(--red)',
                      padding:         '2px 8px',
                      fontSize:        12,
                      fontWeight:      600,
                      flexShrink:      0,
                    }}
                  >
                    {judgeConfidence.toFixed(1)}% · CRITICAL
                  </span>
                )}
              </div>

              {judgeReasoning && <ReasoningBox text={reasoningText} variant="threat" />}

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.3, duration: 0.2 }}
                style={{
                  overflow:        'hidden',
                  borderRadius:    8,
                  border:          '1px solid var(--blue)',
                  backgroundColor: 'var(--blue-bg)',
                  padding:         '10px 12px',
                }}
              >
                <p className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', margin: 0 }}>
                  🛡 Worm quarantined at security gate
                </p>
                <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-2)' }}>
                  All 8 downstream agents are protected. No business data was reached.
                </p>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}
