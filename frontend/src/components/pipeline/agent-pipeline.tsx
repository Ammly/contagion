'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, CalendarDays, Code2, Banknote, Users,
  Database, Search, FolderOpen, Scale,
} from 'lucide-react'
import { useSimulationStore, AGENT_ORDER, AGENT_META } from '@/stores/simulation-store'
import type { AgentStatus, AgentId, AgentState } from '@/types/events'
import { AgentDetailPanel } from './agent-detail-panel'

const F = '"Manrope", system-ui, sans-serif'

// ── Lucide icon map ────────────────────────────────────────────────────────────

const AGENT_ICONS: Record<AgentId, React.ComponentType<{ size?: number; color?: string }>> = {
  email:    Mail,
  calendar: CalendarDays,
  code:     Code2,
  finance:  Banknote,
  hr:       Users,
  crm:      Database,
  search:   Search,
  file:     FolderOpen,
}

// Descriptive sub-labels matching the mockup design
const AGENT_SUBTITLES: Record<AgentId, string> = {
  email:    'n8n Internal Node',
  calendar: 'OAuth Connected',
  code:     'Sandboxed Runtime',
  finance:  'High Privilege',
  hr:       'PII Restricted',
  crm:      'Salesforce Sync',
  search:   'Web-access Enabled',
  file:     'Local FS Access',
}

// ── Status badge ───────────────────────────────────────────────────────────────

function statusBadgeProps(status: AgentStatus, generation?: number) {
  const label =
    status === 'idle'                         ? 'STANDBY'   :
    status === 'processing'                   ? 'PROCESSING' :
    status === 'clean' || status === 'protected' ? 'CLEAN'  :
    status === 'infected'                     ? `INFECTED · GEN ${generation ?? '?'}` :
    status === 'blocked'                      ? 'BLOCKED'   : 'STANDBY'

  const color =
    status === 'clean' || status === 'protected' ? '#006c49' :
    status === 'infected'                     ? '#dc2626'  :
    status === 'processing'                   ? '#006c49'  :
    status === 'blocked'                      ? '#2563eb'  : '#94a3b8'

  const bg =
    status === 'clean' || status === 'protected' ? 'rgba(110,248,187,0.35)' :
    status === 'infected'                     ? 'rgba(220,38,38,0.08)'   :
    status === 'processing'                   ? 'rgba(0,108,73,0.08)'    :
    status === 'blocked'                      ? 'rgba(37,99,235,0.08)'   : 'transparent'

  return { label, color, bg }
}

// ── Agent card ─────────────────────────────────────────────────────────────────

type AgentCardProps = {
  agentId:  AgentId
  state:    AgentState
  index:    number
  selected: boolean
  onClick:  () => void
}

function AgentCard({ agentId, state, index, selected, onClick }: AgentCardProps) {
  const meta      = AGENT_META[agentId]
  const IconComp  = AGENT_ICONS[agentId]
  const { status, generation } = state
  const badge     = statusBadgeProps(status, generation)
  const isClickable = status !== 'idle'

  const isProcessing = status === 'processing'
  const isInfected   = status === 'infected'
  const isBlocked    = status === 'blocked'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.18, ease: 'easeOut' }}
      onClick={isClickable ? onClick : undefined}
      style={{
        background:    'white',
        padding:       24,
        borderRadius:  12,
        border:
          isInfected   ? '1px solid rgba(220,38,38,0.25)'  :
          isProcessing ? '1px solid rgba(0,108,73,0.2)'    :
          isBlocked    ? '1px solid rgba(37,99,235,0.2)'   :
          selected     ? '1px solid rgba(0,108,73,0.4)'    :
          '1px solid rgba(226,232,240,0.8)',
        boxShadow:
          isInfected   ? '0 4px 16px rgba(220,38,38,0.1)'  :
          isProcessing ? '0 4px 16px rgba(0,108,73,0.1)'   :
          '0 1px 3px rgba(0,0,0,0.05)',
        display:       'flex',
        flexDirection: 'column',
        gap:           12,
        cursor:        isClickable ? 'pointer' : 'default',
        transition:    'box-shadow 0.2s, border-color 0.2s',
        fontFamily:    F,
        position:      'relative',
        overflow:      'hidden',
        outline:       selected ? '2px solid rgba(0,108,73,0.35)' : 'none',
        outlineOffset: 2,
      }}
    >
      {/* Processing progress bar */}
      {isProcessing && (
        <div
          style={{
            position:     'absolute',
            bottom:       0,
            left:         0,
            right:        0,
            height:       4,
            background:   'rgba(0,108,73,0.1)',
            overflow:     'hidden',
            borderRadius: '0 0 11px 11px',
          }}
        >
          <div
            className="progress-bar-anim"
            style={{ position: 'absolute', height: '100%', width: '50%', background: '#006c49', borderRadius: 1 }}
          />
        </div>
      )}

      {/* Top row: icon + badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width:           48,
            height:          48,
            background:      isProcessing ? 'rgba(0,108,73,0.08)' : isInfected ? 'rgba(220,38,38,0.08)' : '#f1f5f9',
            borderRadius:    10,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            color:           isProcessing ? '#006c49' : isInfected ? '#dc2626' : '#565e74',
            transition:      'background 0.3s, color 0.3s',
            flexShrink:      0,
          }}
        >
          <IconComp size={26} />
        </div>

        <AnimatePresence mode="wait">
          <motion.span
            key={status + generation}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.1 }}
            style={{
              padding:      '6px 14px',
              background:   badge.bg,
              color:        badge.color,
              fontSize:     15,
              fontWeight:   700,
              borderRadius: 999,
              border:       `1px solid ${badge.color}33`,
              whiteSpace:   'nowrap',
              fontFamily:   '"JetBrains Mono", monospace',
            }}
          >
            {badge.label}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Name + subtitle */}
      <div>
        <h4
          style={{
            fontWeight:   700,
            fontSize:     20,
            color:        '#1e293b',
            marginBottom: 6,
          }}
        >
          {meta.label}
        </h4>
        <p style={{ fontSize: 15, color: 'rgba(60,74,66,0.55)', lineHeight: 1.3 }}>
          {AGENT_SUBTITLES[agentId]}
        </p>
      </div>
    </motion.div>
  )
}

// ── Judge card ─────────────────────────────────────────────────────────────────

type JudgeStatus = 'idle' | 'scanning' | 'cleared' | 'blocked'

function JudgeCard({
  judgeEnabled,
  judgeStatus,
  confidence,
  verdict,
}: {
  judgeEnabled: boolean
  judgeStatus:  JudgeStatus
  confidence:   number | null
  verdict:      string | null
}) {
  const isScanning = judgeStatus === 'scanning'
  const isCleared  = judgeStatus === 'cleared'
  const isBlocked  = judgeStatus === 'blocked'
  const isActive   = judgeEnabled && judgeStatus === 'idle'

  // ── Color tokens by state ────────────────────────────────────────────────
  const accent =
    isBlocked  ? '#dc2626' :
    isCleared  ? '#006c49' :
    isScanning ? '#b45309' :
    isActive   ? '#006c49' : '#64748b'

  const cardBg =
    isBlocked  ? 'linear-gradient(160deg, #450a0a 0%, #7f1d1d 100%)' :
    isCleared  ? 'linear-gradient(160deg, #052e16 0%, #14532d 100%)' :
    isScanning ? 'linear-gradient(160deg, #451a03 0%, #78350f 100%)' :
    isActive   ? 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' :
                 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)'

  const isDark = isBlocked || isCleared || isScanning || isActive

  const iconBg =
    isBlocked  ? 'rgba(255,255,255,0.15)' :
    isCleared  ? 'rgba(255,255,255,0.15)' :
    isScanning ? 'rgba(255,255,255,0.15)' :
    isActive   ? 'rgba(255,255,255,0.10)' :
                 '#e2e8f0'

  const iconColor = isDark ? 'white' : '#64748b'

  const badgeText =
    isBlocked  ? '⛔  THREAT BLOCKED'  :
    isCleared  ? '✓  CLEARED'          :
    isScanning ? 'SCANNING…'           :
    isActive   ? 'ACTIVE GUARD'        : 'INACTIVE'

  const badgeBg =
    isBlocked  ? 'rgba(255,255,255,0.15)' :
    isCleared  ? 'rgba(255,255,255,0.15)' :
    isScanning ? 'rgba(255,255,255,0.15)' :
    isActive   ? 'rgba(255,255,255,0.10)' :
                 'rgba(100,116,139,0.10)'

  const badgeColor = isDark ? 'rgba(255,255,255,0.9)' : '#64748b'

  const labelColor    = isDark ? 'rgba(255,255,255,0.5)'  : '#94a3b8'
  const titleColor    = isDark ? '#ffffff'                 : '#1e293b'
  const subtitleColor = isDark ? 'rgba(255,255,255,0.55)' : '#64748b'

  const glowColor =
    isBlocked  ? 'rgba(220,38,38,0.5)'   :
    isCleared  ? 'rgba(0,108,73,0.5)'    :
    isScanning ? 'rgba(217,119,6,0.5)'   :
    isActive   ? 'rgba(30,41,59,0.4)'    : 'rgba(0,0,0,0.08)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: F }}>
      <motion.div
        animate={{ boxShadow: `0 12px 48px ${glowColor}` }}
        transition={{ duration: 0.4 }}
        style={{
          flex:           1,
          borderRadius:   20,
          background:     cardBg,
          border:         `1.5px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(226,232,240,0.8)'}`,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          textAlign:      'center',
          padding:        '32px 24px',
          position:       'relative',
          overflow:       'hidden',
        }}
      >
        {/* Scanning pulse ring */}
        {isScanning && (
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{
              position:     'absolute',
              width:        160,
              height:       160,
              borderRadius: '50%',
              border:       '2px solid rgba(217,119,6,0.4)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Top label */}
        <p style={{ fontSize: 11, fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 20, fontFamily: '"JetBrains Mono", monospace' }}>
          Model as a Judge
        </p>

        {/* Icon */}
        <motion.div
          animate={{ background: iconBg }}
          transition={{ duration: 0.4 }}
          style={{
            width:          96,
            height:         96,
            borderRadius:   24,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            marginBottom:   20,
            boxShadow:      isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <Scale size={48} color={iconColor} strokeWidth={1.5} />
        </motion.div>

        {/* Title */}
        <h3 style={{ fontWeight: 800, fontSize: 24, color: titleColor, marginBottom: 4, letterSpacing: '-0.01em' }}>
          Judge Agent
        </h3>
        <p style={{ fontSize: 14, color: subtitleColor, marginBottom: 20 }}>
          Security Gatekeeper
        </p>

        {/* Status badge */}
        <AnimatePresence mode="wait">
          <motion.span
            key={badgeText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              padding:      '7px 20px',
              background:   badgeBg,
              color:        badgeColor,
              fontSize:     14,
              fontWeight:   700,
              borderRadius: 999,
              border:       `1px solid ${isDark ? 'rgba(255,255,255,0.20)' : 'rgba(100,116,139,0.2)'}`,
              fontFamily:   '"JetBrains Mono", monospace',
              display:      'flex',
              alignItems:   'center',
              gap:          8,
            }}
          >
            {isScanning && (
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
                style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.8)' }}
              />
            )}
            {badgeText}
          </motion.span>
        </AnimatePresence>

        {/* Confidence readout — the hero moment */}
        <AnimatePresence>
          {confidence !== null && (isCleared || isBlocked) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.85, y: 10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                marginTop:    24,
                width:        '100%',
                background:   'rgba(0,0,0,0.2)',
                borderRadius: 14,
                padding:      '16px 12px 12px',
                border:       '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  fontSize:      72,
                  fontWeight:    800,
                  color:         '#ffffff',
                  lineHeight:    1,
                  letterSpacing: '-0.03em',
                  margin:        0,
                  fontFamily:    '"Manrope", system-ui, sans-serif',
                }}
              >
                {Math.round(confidence)}
                <span style={{ fontSize: 32, fontWeight: 600, opacity: 0.7 }}>%</span>
              </motion.p>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 6, fontFamily: '"JetBrains Mono", monospace' }}>
                Confidence
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verdict snippet */}
        <AnimatePresence>
          {verdict && (isCleared || isBlocked) && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0 }}
              transition={{ duration: 0.25, delay: 0.15 }}
              style={{
                marginTop:  16,
                fontSize:   12,
                fontWeight: 600,
                color:      'rgba(255,255,255,0.60)',
                fontFamily: '"JetBrains Mono", monospace',
                lineHeight: 1.4,
                padding:    '0 4px',
              }}
            >
              {verdict.length > 48 ? verdict.slice(0, 48) + '…' : verdict}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Connector to agent grid */}
      <div
        style={{
          width:      3,
          height:     36,
          alignSelf:  'center',
          marginTop:  12,
          background: `repeating-linear-gradient(to bottom, ${accent}80 0, ${accent}80 5px, transparent 5px, transparent 10px)`,
          opacity:    0.7,
        }}
      />
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function AgentPipeline() {
  const agents       = useSimulationStore(s => s.agents)
  const judgeEnabled    = useSimulationStore(s => s.judgeEnabled)
  const judgeStatus     = useSimulationStore(s => s.judgeStatus)
  const judgeResult     = useSimulationStore(s => s.judgeResult)
  const judgeConfidence = useSimulationStore(s => s.judgeConfidence)
  const selectAgent  = useSimulationStore(s => s.selectAgent)
  const selectedAgent = useSimulationStore(s => s.selectedAgent)

  return (
    <div
      style={{
        transition:   'padding-right 0.25s ease-out',
        paddingRight: selectedAgent
          ? (typeof window !== 'undefined' && window.innerWidth >= 768 ? 420 : 0)
          : 0,
      }}
    >
      {/* Decorative SVG wave background */}
      <div
        aria-hidden
        style={{
          position:       'absolute',
          inset:          0,
          pointerEvents:  'none',
          zIndex:         0,
          overflow:       'hidden',
          borderRadius:   12,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 300"
          preserveAspectRatio="none"
          fill="none"
          stroke="#565e74"
          strokeWidth="1.5"
          strokeDasharray="8 8"
          opacity="0.05"
        >
          <path d="M0 150 C 150 150, 200 80, 350 80 S 500 220, 650 220 S 800 80, 900 80 S 950 150, 1000 150" />
        </svg>
      </div>

      {/* 5-column grid: [Judge] [4×2 agent cards] */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: '1fr 4fr',
          gap:                 40,
          position:            'relative',
          zIndex:              1,
        }}
      >
        {/* Judge column */}
        <JudgeCard
          judgeEnabled={judgeEnabled}
          judgeStatus={judgeStatus}
          confidence={judgeConfidence}
          verdict={judgeResult?.verdict ?? null}
        />

        {/* Agent grid: 4 cols × 2 rows */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap:                 24,
          }}
        >
          {AGENT_ORDER.map((agentId, idx) => (
            <AgentCard
              key={agentId}
              agentId={agentId}
              state={agents[agentId]}
              index={idx}
              selected={selectedAgent === agentId}
              onClick={() => selectAgent(agentId)}
            />
          ))}
        </div>
      </div>

      {/* Slide-out detail panel (fixed overlay) */}
      <AgentDetailPanel />
    </div>
  )
}
