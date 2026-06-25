'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore, AGENT_META } from '@/stores/simulation-store'
import type { AgentId } from '@/types/events'

const MONO = '"JetBrains Mono", ui-monospace, monospace'
const SANS = '"Manrope", system-ui, sans-serif'

type Tab = 'summary' | 'full' | 'raw'

// ── Parse agentOutput that may still be { raw: "```json\n..." } in memory ─────

function resolveOutput(agentOutput: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!agentOutput) return null
  if ('raw' in agentOutput && typeof agentOutput.raw === 'string') {
    const stripped = agentOutput.raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    try {
      const parsed = JSON.parse(stripped)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
    } catch { /* ignore */ }
  }
  return agentOutput
}

// ── Value renderers ────────────────────────────────────────────────────────────

function formatValue(key: string, val: unknown): React.ReactNode {
  if (val === null || val === undefined || val === '') return (
    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>
  )

  if (key === 'priority') {
    const s = String(val).toUpperCase()
    const color = s === 'URGENT' ? '#dc2626' : s === 'HIGH' ? '#ea580c' : s === 'MEDIUM' ? '#d97706' : '#16a34a'
    return (
      <span style={{ color, fontWeight: 700, fontSize: 15 }}>{s}</span>
    )
  }

  if (key === 'anomalyFlags' || key === 'flags' || key === 'blockers') {
    const s = String(val)
    const isAlert = s.toUpperCase() !== 'NONE DETECTED' && s.toUpperCase() !== 'NONE'
    return (
      <span style={{ color: isAlert ? '#dc2626' : '#16a34a', fontWeight: isAlert ? 700 : 400 }}>
        {isAlert ? `⚠ ${s}` : `✓ ${s}`}
      </span>
    )
  }

  if (key === 'approvalStatus' || key === 'paymentStatus' || key === 'crmAction' || key === 'calendarAction' || key === 'techAction' || key === 'hrAction' || key === 'searchAction' || key === 'archiveStatus') {
    const s = String(val).toUpperCase()
    const isGood = s.includes('APPROV') || s.includes('PAID') || s.includes('COMPLETE') || s.includes('CURRENT') || s.includes('SCHEDULED') || s.includes('CONFIRMED') || s.includes('TRIGGERED') || s.includes('RETRIEVED') || s.includes('REFERENCED') || s.includes('UPDATED') || s.includes('INITIATED') || s.includes('CLEARED')
    const isPending = s.includes('PENDING') || s.includes('QUEUED') || s.includes('REVIEW')
    const color = isGood ? '#16a34a' : isPending ? '#d97706' : '#475569'
    return (
      <span
        style={{
          background:   `${color}15`,
          color,
          border:       `1px solid ${color}40`,
          borderRadius: 6,
          padding:      '3px 10px',
          fontWeight:   700,
          fontSize:     13,
          fontFamily:   MONO,
        }}
      >
        {String(val)}
      </span>
    )
  }

  if (key === 'compliance') {
    const s = String(val).toUpperCase()
    const ok = s.includes('PASS') || s.includes('OK')
    return <span style={{ color: ok ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{String(val)}</span>
  }

  if (key === 'amount' || key === 'contractValue') {
    return <span style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{String(val)}</span>
  }

  if (key === 'archiveRef' || key === 'paymentRef' || key === 'meetingRef' || key === 'techRef' || key === 'hrRef') {
    return (
      <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 10px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
        {String(val)}
      </span>
    )
  }

  if (key === 'relationshipScore') {
    const n = Number(val)
    const color = n < 50 ? '#dc2626' : n < 75 ? '#d97706' : '#16a34a'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', maxWidth: 120 }}>
          <div style={{ width: `${Math.min(100, Math.max(0, n))}%`, height: '100%', background: color, borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color }}>{n}/100</span>
      </div>
    )
  }

  if (key === 'meetLink') {
    return (
      <a href={String(val)} style={{ color: '#2563eb', textDecoration: 'underline', fontSize: 14, fontFamily: MONO, wordBreak: 'break-all' }} target="_blank" rel="noopener noreferrer">
        {String(val)}
      </a>
    )
  }

  if (key === 'recommendedArchivePath' || key === 'archivePath') {
    return (
      <span style={{ fontFamily: MONO, fontSize: 13, color: '#475569', background: '#f1f5f9', padding: '3px 10px', borderRadius: 6, wordBreak: 'break-all' }}>
        {String(val)}
      </span>
    )
  }

  if (key === 'tier') {
    const colors: Record<string, string> = { Enterprise: '#7c3aed', 'Mid-Market': '#2563eb', SME: '#0891b2', UNKNOWN: '#94a3b8' }
    const c = colors[String(val)] ?? '#475569'
    return <span style={{ color: c, fontWeight: 700 }}>{String(val)}</span>
  }

  if (typeof val === 'boolean') {
    return <span style={{ color: val ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{val ? 'YES' : 'NO'}</span>
  }

  // Nested objects → render as a mini key-value block
  if (typeof val === 'object' && val !== null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
        {Object.entries(val as Record<string, unknown>).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0, paddingTop: 2, minWidth: 80 }}>
              {k}
            </span>
            <span style={{ fontSize: 14, color: '#1e293b', wordBreak: 'break-word' }}>
              {v === null || v === undefined ? '—' : String(v)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return <span style={{ fontSize: 15, color: '#1e293b' }}>{String(val)}</span>
}

// ── Summary row ───────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  valKey,
  isLast,
}: {
  label:   string
  value:   unknown
  valKey:  string
  isLast?: boolean
}) {
  if (value === undefined) return null

  const isBlock =
    valKey === 'recordsRetrieved' ||
    valKey === 'archivePath' ||
    valKey === 'recommendedArchivePath' ||
    valKey === 'pipelineSummary' ||
    valKey === 'knowledgeNotes' ||
    (typeof value === 'object' && value !== null)

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: isBlock ? 'column' : 'row',
        justifyContent: isBlock ? 'flex-start' : 'space-between',
        alignItems:    isBlock ? 'flex-start' : 'center',
        gap:           isBlock ? 6 : 12,
        padding:       '12px 0',
        borderBottom:  isLast ? 'none' : '1px solid #f1f5f9',
      }}
    >
      <span
        style={{
          fontFamily:    MONO,
          fontSize:      11,
          fontWeight:    700,
          color:         '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          flexShrink:    0,
        }}
      >
        {label}
      </span>
      <div style={{ fontFamily: SANS, textAlign: isBlock ? 'left' : 'right', maxWidth: isBlock ? '100%' : '65%' }}>
        {formatValue(valKey, value)}
      </div>
    </div>
  )
}

// ── JSON viewer ───────────────────────────────────────────────────────────────

function JsonViewer({ obj, hasWorm }: { obj: Record<string, unknown>; hasWorm: boolean }) {
  const json  = JSON.stringify(obj, null, 2)
  const lines = json.split('\n')

  return (
    <pre
      style={{
        background:   '#0f172a',
        border:       '1px solid #1e293b',
        borderRadius: 12,
        padding:      20,
        overflowY:    'auto',
        maxHeight:    480,
        fontFamily:   MONO,
        fontSize:     13,
        lineHeight:   1.7,
        margin:       0,
        color:        '#cbd5e1',
      }}
    >
      {lines.map((line, i) => {
        const m = line.match(/^(\s*)(".*?")(:\s)?(.*)$/)
        if (!m) return <div key={i} style={{ color: '#94a3b8' }}>{line}</div>

        const [, indent, key, colon, rest] = m
        let valNode: React.ReactNode = <span>{rest}</span>

        if (rest) {
          const isWormLine = hasWorm && rest.includes('[CONTAGION-v2.1-BEGIN]')
          if (isWormLine) {
            valNode = <span style={{ background: '#dc2626', color: '#fff', padding: '0 4px', borderRadius: 3 }}>{rest} <span style={{ fontSize: 11, fontWeight: 700 }}>⚠ WORM</span></span>
          } else if (rest.startsWith('"')) {
            valNode = <span style={{ color: '#86efac' }}>{rest}</span>
          } else if (rest === 'true')  { valNode = <span style={{ color: '#34d399' }}>{rest}</span> }
          else if (rest === 'false') { valNode = <span style={{ color: '#f87171' }}>{rest}</span> }
          else if (rest === 'null')  { valNode = <span style={{ color: '#94a3b8' }}>{rest}</span> }
          else if (!isNaN(Number(rest.replace(/,$/, '')))) { valNode = <span style={{ color: '#fbbf24' }}>{rest}</span> }
        }

        return (
          <div key={i}>
            {indent}
            <span style={{ color: '#7dd3fc' }}>{key}</span>
            {colon}
            {valNode}
          </div>
        )
      })}
    </pre>
  )
}

// ── Agent field maps ──────────────────────────────────────────────────────────

const AGENT_FIELDS: Record<AgentId, { label: string; key: string }[]> = {
  email: [
    { label: 'EMAIL TYPE',      key: 'emailType'      },
    { label: 'FROM',            key: 'from'            },
    { label: 'PRIORITY',        key: 'priority'        },
    { label: 'FINANCE ACTION',  key: 'financeAction'   },
    { label: 'CALENDAR ACTION', key: 'calendarAction'  },
    { label: 'HR ACTION',       key: 'hrAction'        },
    { label: 'FILING ACTION',   key: 'filingAction'    },
    { label: 'CRM ACTION',      key: 'crmAction'       },
    { label: 'ANOMALY FLAGS',   key: 'anomalyFlags'    },
  ],
  calendar: [
    { label: 'ACTION',       key: 'calendarAction' },
    { label: 'MEETING REF',  key: 'meetingRef'     },
    { label: 'DATE / TIME',  key: 'proposedDate'   },
    { label: 'DURATION',     key: 'duration'       },
    { label: 'ATTENDEES',    key: 'attendees'      },
    { label: 'MEET LINK',    key: 'meetLink'       },
    { label: 'STATUS',       key: 'status'         },
  ],
  code: [
    { label: 'TECH ACTION',   key: 'techAction'        },
    { label: 'REF',           key: 'techRef'           },
    { label: 'SYSTEMS',       key: 'systemsAffected'   },
    { label: 'TASKS QUEUED',  key: 'integrationTasks'  },
    { label: 'API STATUS',    key: 'apiStatus'         },
    { label: 'BLOCKERS',      key: 'blockers'          },
  ],
  finance: [
    { label: 'INVOICE REF',    key: 'invoiceRef'        },
    { label: 'VENDOR',         key: 'vendor'            },
    { label: 'AMOUNT',         key: 'amount'            },
    { label: 'PAYMENT REF',    key: 'paymentRef'        },
    { label: 'STATUS',         key: 'approvalStatus'    },
    { label: 'AUTHORITY',      key: 'approvalAuthority' },
    { label: 'VENDOR STATUS',  key: 'vendorStatus'      },
    { label: 'PAYMENT DATE',   key: 'paymentDate'       },
    { label: 'NOTES',          key: 'financeNotes'      },
  ],
  hr: [
    { label: 'ACTION',         key: 'hrAction'       },
    { label: 'HR REF',         key: 'hrRef'          },
    { label: 'ROLE',           key: 'roleAffected'   },
    { label: 'ACTION TAKEN',   key: 'actionTaken'    },
    { label: 'SYSTEM UPDATED', key: 'systemUpdated'  },
    { label: 'COMPLIANCE',     key: 'compliance'     },
    { label: 'EFFECTIVE DATE', key: 'effectiveDate'  },
  ],
  crm: [
    { label: 'ACTION',         key: 'crmAction'        },
    { label: 'CUSTOMER ID',    key: 'customerId'        },
    { label: 'COMPANY',        key: 'company'           },
    { label: 'TIER',           key: 'tier'              },
    { label: 'REL. SCORE',     key: 'relationshipScore' },
    { label: 'PAYMENT STATUS', key: 'paymentStatus'     },
    { label: 'CONTRACT VALUE', key: 'contractValue'     },
    { label: 'ACCOUNT MGR',    key: 'accountManager'    },
    { label: 'FLAGS',          key: 'flags'             },
    { label: 'RECORDS',        key: 'recordsRetrieved'  },
  ],
  search: [
    { label: 'ACTION',        key: 'searchAction'           },
    { label: 'POLICIES',      key: 'policiesFound'          },
    { label: 'ARCHIVE PATH',  key: 'recommendedArchivePath' },
    { label: 'CLASS.',        key: 'classification'         },
    { label: 'RETENTION',     key: 'retentionPeriod'        },
    { label: 'PRECEDENTS',    key: 'precedents'             },
    { label: 'NOTES',         key: 'knowledgeNotes'         },
  ],
  file: [
    { label: 'ARCHIVE REF',   key: 'archiveRef'   },
    { label: 'ARCHIVE PATH',  key: 'archivePath'  },
    { label: 'CLASS.',        key: 'classification' },
    { label: 'RETENTION',     key: 'retention'    },
    { label: 'STATUS',        key: 'archiveStatus' },
  ],
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AgentDetailPanel() {
  const selectedAgent = useSimulationStore(s => s.selectedAgent)
  const agents        = useSimulationStore(s => s.agents)
  const selectAgent   = useSimulationStore(s => s.selectAgent)

  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [isMobile,  setIsMobile]  = useState(false)
  const [copied,    setCopied]    = useState(false)

  useEffect(() => { if (selectedAgent) setActiveTab('summary') }, [selectedAgent])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') selectAgent(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectAgent])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function copyJson(obj: unknown) {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      {selectedAgent && (
        <>
          {/* Backdrop (mobile + desktop click-outside) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => selectAgent(null)}
            style={{
              position:        'fixed',
              inset:           0,
              backgroundColor: 'rgba(0,0,0,0.35)',
              zIndex:          48,
              backdropFilter:  'blur(2px)',
            }}
          />

          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0       } : { x: 0       }}
            exit={isMobile    ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            style={{
              position:        'fixed',
              zIndex:          50,
              backgroundColor: '#ffffff',
              display:         'flex',
              flexDirection:   'column',
              boxShadow:       '-8px 0 40px rgba(0,0,0,0.18)',
              fontFamily:      SANS,
              ...(isMobile
                ? {
                    bottom:       0,
                    left:         0,
                    right:        0,
                    height:       '85vh',
                    borderRadius: '20px 20px 0 0',
                    borderTop:    '1px solid #e2e8f0',
                  }
                : {
                    top:          0,
                    right:        0,
                    width:        560,
                    height:       '100vh',
                    borderLeft:   '1px solid #e2e8f0',
                  }),
            }}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div
                style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '14px 0', cursor: 'pointer' }}
                onClick={() => selectAgent(null)}
              >
                <div style={{ width: 44, height: 4, borderRadius: 2, background: '#cbd5e1' }} />
              </div>
            )}

            {(() => {
              const state     = agents[selectedAgent]
              const meta      = AGENT_META[selectedAgent]
              const output    = resolveOutput(state.agentOutput)
              const hasData   = state.status !== 'idle'
              const isInfected = state.wormFound
              const isClean   = !isInfected && state.status !== 'processing' && state.status !== 'blocked' && state.status !== 'idle'
              const duration  = state.startedAt && state.completedAt
                ? ((state.completedAt - state.startedAt) / 1000).toFixed(2) + 's'
                : '—'

              if (!hasData) {
                return (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', gap: 16 }}>
                    <span style={{ fontSize: 56 }}>{meta.icon}</span>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{meta.label}</div>
                    <p style={{ fontSize: 16, color: '#64748b', maxWidth: 280, lineHeight: 1.6 }}>
                      This agent hasn't processed any data yet. Run a simulation first.
                    </p>
                    <button
                      onClick={() => selectAgent(null)}
                      style={{ marginTop: 8, padding: '10px 24px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, color: '#475569', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Close
                    </button>
                  </div>
                )
              }

              return (
                <>
                  {/* ── Header ─────────────────────────────────────────── */}
                  <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 38 }}>{meta.icon}</span>
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{meta.label}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding:      '3px 10px',
                                borderRadius: 6,
                                background:   isInfected ? '#fee2e2' : isClean ? '#dcfce7' : '#f1f5f9',
                                color:        isInfected ? '#dc2626' : isClean ? '#16a34a' : '#64748b',
                                fontWeight:   700,
                                fontSize:     12,
                                fontFamily:   MONO,
                                textTransform: 'uppercase',
                                border:       `1px solid ${isInfected ? '#fca5a5' : isClean ? '#86efac' : '#e2e8f0'}`,
                              }}
                            >
                              {state.status}
                            </span>
                            <span style={{ fontSize: 13, color: '#94a3b8' }}>·</span>
                            <span style={{ fontSize: 13, color: '#64748b', fontFamily: MONO }}>{duration}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => selectAgent(null)}
                        style={{
                          width:          36,
                          height:         36,
                          borderRadius:   10,
                          border:         '1px solid #e2e8f0',
                          background:     '#f8fafc',
                          color:          '#64748b',
                          fontSize:       20,
                          cursor:         'pointer',
                          display:        'flex',
                          alignItems:     'center',
                          justifyContent: 'center',
                          flexShrink:     0,
                        }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Status banner */}
                    {isInfected && (
                      <div style={{ background: '#dc2626', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        ⚠ WORM PAYLOAD REPLICATED — Generation {state.generation}
                      </div>
                    )}
                    {isClean && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        ✓ CLEAN — No injection detected
                      </div>
                    )}
                  </div>

                  {/* ── Tabs ───────────────────────────────────────────── */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 28px', flexShrink: 0 }}>
                    {(['summary', 'full', 'raw'] as Tab[]).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          padding:      '14px 18px',
                          background:   'none',
                          border:       'none',
                          borderBottom: activeTab === tab ? '2px solid #006c49' : '2px solid transparent',
                          color:        activeTab === tab ? '#006c49' : '#94a3b8',
                          fontSize:     14,
                          fontWeight:   700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          cursor:       'pointer',
                          transition:   'color 0.15s, border-color 0.15s',
                        }}
                      >
                        {tab === 'full' ? 'Full Output' : tab === 'raw' ? 'Metadata' : 'Summary'}
                      </button>
                    ))}
                  </div>

                  {/* ── Body ───────────────────────────────────────────── */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 32px' }}>

                    {/* SUMMARY TAB */}
                    {activeTab === 'summary' && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {output
                          ? (AGENT_FIELDS[selectedAgent] ?? []).map((f, i, arr) => (
                              <SummaryRow
                                key={f.key}
                                label={f.label}
                                valKey={f.key}
                                value={output[f.key]}
                                isLast={i === arr.length - 1}
                              />
                            ))
                          : (
                            <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 15 }}>No structured output available.</p>
                          )
                        }

                        {/* Agent summary sentence */}
                        {Boolean(state.summary || output?.summary) && (
                          <div style={{ marginTop: 20, padding: '16px 18px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                            <p style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                              Agent Summary
                            </p>
                            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                              {state.summary ?? String(output?.summary ?? '')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FULL OUTPUT TAB */}
                    {activeTab === 'full' && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => copyJson(output ?? state.agentOutput)}
                          style={{
                            position:    'absolute',
                            top:         12,
                            right:       12,
                            padding:     '5px 12px',
                            background:  '#1e293b',
                            border:      'none',
                            borderRadius: 6,
                            fontSize:    12,
                            color:       copied ? '#86efac' : '#94a3b8',
                            fontFamily:  MONO,
                            cursor:      'pointer',
                            zIndex:      10,
                            fontWeight:  600,
                            transition:  'color 0.2s',
                          }}
                        >
                          {copied ? '✓ Copied' : 'Copy JSON'}
                        </button>
                        {output
                          ? <JsonViewer obj={output} hasWorm={isInfected} />
                          : <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 15 }}>No output available.</p>
                        }
                      </div>
                    )}

                    {/* METADATA TAB */}
                    {activeTab === 'raw' && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <SummaryRow label="AGENT ID"        valKey="id"          value={state.id}          />
                        <SummaryRow label="STATUS"          valKey="status"       value={state.status}      />
                        <SummaryRow label="WORM FOUND"      valKey="wormFound"    value={state.wormFound}   />
                        <SummaryRow label="GENERATION"      valKey="generation"   value={state.generation || '—'} />
                        <SummaryRow label="PROCESSING TIME" valKey="duration"     value={duration}          />
                        <SummaryRow label="STARTED AT"      valKey="startedAt"    value={state.startedAt    ? new Date(state.startedAt).toLocaleTimeString()  : '—'} />
                        <SummaryRow label="COMPLETED AT"    valKey="completedAt"  value={state.completedAt  ? new Date(state.completedAt).toLocaleTimeString() : '—'} isLast={!Object.keys(state.extras ?? {}).length} />
                        {Object.entries(state.extras ?? {}).map(([key, val], i, arr) => (
                          <SummaryRow
                            key={key}
                            label={key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                            valKey={key}
                            value={val}
                            isLast={i === arr.length - 1}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
