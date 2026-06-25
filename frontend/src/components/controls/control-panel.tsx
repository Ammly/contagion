'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, RotateCcw, PlayCircle, Network, HelpCircle, LogOut } from 'lucide-react'
import { useSimulationStore } from '@/stores/simulation-store'

const F = '"Manrope", system-ui, sans-serif'

export function ControlPanel() {
  const running         = useSimulationStore(s => s.running)
  const judgeEnabled    = useSimulationStore(s => s.judgeEnabled)
  const setJudge        = useSimulationStore(s => s.setJudgeEnabled)
  const reset           = useSimulationStore(s => s.reset)
  const setToast        = useSimulationStore(s => s.setToast)
  const outcome         = useSimulationStore(s => s.outcome)
  const setComposerOpen = useSimulationStore(s => s.setComposerOpen)

  const [resetting, setResetting] = useState(false)

  // Keep a ref for the keyboard handler so it always sees current running state
  const runningRef = useRef(running)
  useEffect(() => { runningRef.current = running }, [running])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.key.toLowerCase()) {
        case 'j':
          if (!runningRef.current) setJudge(!useSimulationStore.getState().judgeEnabled)
          break
        case 'e':
          if (!runningRef.current && !useSimulationStore.getState().outcome) {
            setComposerOpen(true)
          }
          break
        case 'r':
          if (!runningRef.current) handleReset()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setJudge, setComposerOpen])

  async function handleReset() {
    setResetting(true)
    try { await fetch('/api/reset', { method: 'POST' }) } catch {
      setToast('Could not connect to server to reset.')
    }
    reset()
    setResetting(false)
  }

  const sendDisabled = running || !!outcome

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: F }}>

      {/* ── Section header ─────────────────────────────────────────── */}
      <div style={{ padding: '24px 20px 16px' }}>
        <h2
          style={{
            fontSize:      14,
            fontWeight:    700,
            color:         '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom:  5,
          }}
        >
          Simulation Controls
        </h2>
        <p style={{ fontSize: 15, color: '#94a3b8' }}>Active Session: Mesh-04</p>
      </div>

      {/* ── Controls ───────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Judge Agent toggle card */}
        <div
          style={{
            background:     'white',
            borderRadius:   12,
            padding:        '16px 18px',
            boxShadow:      '0 1px 3px rgba(0,0,0,0.06)',
            border:         '1px solid rgba(226,232,240,0.8)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 600, color: '#565e74' }}>Judge Agent</span>
          <button
            onClick={() => setJudge(!judgeEnabled)}
            disabled={running}
            aria-label={judgeEnabled ? 'Disable Judge Agent' : 'Enable Judge Agent'}
            style={{
              position:    'relative',
              width:        56,
              height:       32,
              borderRadius: 999,
              background:   judgeEnabled ? '#006c49' : '#cbd5e1',
              border:       'none',
              cursor:       running ? 'not-allowed' : 'pointer',
              opacity:      running ? 0.5 : 1,
              flexShrink:   0,
              transition:   'background 0.2s',
            }}
          >
            <motion.span
              animate={{ x: judgeEnabled ? 28 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                position:     'absolute',
                top:          4,
                left:         0,
                width:        25,
                height:       25,
                borderRadius: '50%',
                background:   'white',
                boxShadow:    '0 1px 4px rgba(0,0,0,0.25)',
              }}
            />
          </button>
        </div>

        {/* Send Email to Mesh — opens composer modal */}
        <button
          onClick={() => setComposerOpen(true)}
          disabled={sendDisabled}
          style={{
            width:          '100%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            12,
            padding:        '18px 22px',
            borderRadius:   12,
            border:         'none',
            background:     sendDisabled
              ? '#e2e8f0'
              : 'linear-gradient(135deg, #565e74 0%, #9ba2bb 100%)',
            color:          sendDisabled ? '#94a3b8' : 'white',
            fontSize:       18,
            fontWeight:     600,
            cursor:         sendDisabled ? 'not-allowed' : 'pointer',
            boxShadow:      sendDisabled ? 'none' : '0 4px 14px rgba(86,94,116,0.30)',
            transition:     'all 0.2s',
            fontFamily:     F,
          }}
        >
          <Send size={20} />
          {running ? 'Running…' : 'Send Email to Mesh'}
        </button>

        {/* Reset — visible when running or completed */}
        {(running || outcome) && (
          <button
            onClick={handleReset}
            disabled={resetting}
            style={{
              width:          '100%',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            12,
              padding:        '18px 22px',
              borderRadius:   12,
              background:     'white',
              border:         '1px solid rgba(226,232,240,0.9)',
              color:          '#565e74',
              fontSize:       18,
              fontWeight:     600,
              cursor:         resetting ? 'not-allowed' : 'pointer',
              transition:     'all 0.2s',
              fontFamily:     F,
            }}
          >
            <RotateCcw size={16} />
            {resetting ? 'Resetting…' : 'Reset Mesh'}
          </button>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav style={{ padding: '28px 10px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <a
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            12,
            padding:        '12px 16px',
            borderRadius:   10,
            background:     'white',
            color:          '#006c49',
            fontSize:       18,
            fontWeight:     500,
            textDecoration: 'none',
            boxShadow:      '0 1px 3px rgba(0,0,0,0.06)',
            cursor:         'default',
          }}
        >
          <PlayCircle size={24} /> Simulation
        </a>
        <a
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            12,
            padding:        '12px 16px',
            borderRadius:   10,
            color:          '#94a3b8',
            fontSize:       18,
            fontWeight:     500,
            textDecoration: 'none',
            cursor:         'pointer',
          }}
        >
          <Network size={24} /> Agent Nodes
        </a>
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* ── Bottom: shortcuts + support/logout ─────────────────────── */}
      <div
        style={{
          padding:       '20px 20px 28px',
          borderTop:     '1px solid #e2e8f0',
          display:       'flex',
          flexDirection: 'column',
          gap:           18,
        }}
      >
        {/* Shortcuts */}
        <div>
          <p
            style={{
              fontSize:      13,
              fontWeight:    700,
              color:         'rgba(60,74,66,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom:  10,
            }}
          >
            Shortcuts
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 16, color: '#64748b' }}>
            {[
              { label: 'Toggle Judge',    key: 'J' },
              { label: 'Open Composer',   key: 'E' },
              { label: 'Reset Mesh',      key: 'R' },
            ].map(s => (
              <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{s.label}</span>
                <kbd
                  style={{
                    padding:      '4px 10px',
                    background:   '#e2e8f0',
                    borderRadius: 6,
                    fontSize:     13,
                    color:        '#374151',
                    fontFamily:   'monospace',
                    fontWeight:   600,
                  }}
                >
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Support / Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { icon: <HelpCircle size={24} />, label: 'Support' },
            { icon: <LogOut     size={24} />, label: 'Logout'  },
          ].map(item => (
            <a
              key={item.label}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            12,
                padding:        '12px 16px',
                borderRadius:   10,
                color:          '#94a3b8',
                fontSize:       18,
                fontWeight:     500,
                textDecoration: 'none',
                cursor:         'pointer',
              }}
            >
              {item.icon} {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
