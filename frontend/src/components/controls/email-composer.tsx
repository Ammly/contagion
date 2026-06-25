'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useSimulationStore } from '@/stores/simulation-store'
import { EMAIL_TEMPLATES } from '@/lib/constants'

const WORM_MARKER = '[CONTAGION-v2.1-BEGIN]'

type TemplateId = 'clean' | 'worm' | null

function containsWorm(text: string) {
  return text.includes(WORM_MARKER)
}

// ── Responsive hook ───────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

// ── Template card ─────────────────────────────────────────────────────────────

const CARD_META: Record<string, { emoji: string; name: string; sub: string }> = {
  clean: {
    emoji: '✅',
    name:  'Clean Email',
    sub:   'Normal vendor invoice + meeting request',
  },
  worm: {
    emoji: '🐛',
    name:  'Infected Email',
    sub:   'Contains hidden CONTAGION worm payload',
  },
}

function TemplateCard({
  id,
  selected,
  onSelect,
}: {
  id:       string
  selected: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const meta = CARD_META[id]

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         'flex',
        flexDirection:   'column',
        gap:             6,
        borderRadius:    16,
        border:          `1px solid ${selected ? '#006c49' : hovered ? '#cbd5e1' : 'rgba(226,232,240,0.8)'}`,
        backgroundColor: selected ? 'rgba(0,108,73,0.08)' : 'transparent',
        padding:         18,
        cursor:          'pointer',
        textAlign:       'left',
        transition:      'border-color 0.15s ease, background-color 0.15s ease',
        width:           '100%',
      }}
    >
      {/* Top row: emoji + name */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>{meta.emoji}</span>
          <span
            className="font-display"
            style={{ fontWeight: 700, fontSize: 20, color: '#1e293b' }}
          >
            {meta.name}
          </span>
        </div>
      </div>

      {/* Sub */}
      <span style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.4 }}>
        {meta.sub}
      </span>

      {/* Worm badge */}
      {id === 'worm' && (
        <span
          className="font-mono"
          style={{
            display:         'inline-flex',
            alignSelf:       'flex-start',
            marginTop:       4,
            borderRadius:    999,
            border:          '1px solid rgba(227,30,36,0.3)',
            backgroundColor: 'rgba(220,38,38,0.08)',
            color:           '#dc2626',
            padding:         '3px 10px',
            fontSize:        13,
            fontWeight:      700,
          }}
        >
          ⚠ Worm
        </span>
      )}
    </button>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function EmailComposer() {
  const composerOpen    = useSimulationStore(s => s.composerOpen)
  const setComposerOpen = useSimulationStore(s => s.setComposerOpen)
  const setToast        = useSimulationStore(s => s.setToast)
  const judgeEnabled    = useSimulationStore(s => s.judgeEnabled)

  const [selected, setSelected] = useState<TemplateId>(null)
  const [body, setBody]         = useState('')
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [sendHover, setSendHover] = useState(false)
  const textareaRef             = useRef<HTMLTextAreaElement>(null)
  const isMobile                = useIsMobile()

  function onClose() { setComposerOpen(false) }

  function selectTemplate(id: TemplateId) {
    setSelected(id)
    if (id === null) { setBody(''); return }
    const tpl = EMAIL_TEMPLATES.find(t => t.id === id)
    if (tpl) setBody(tpl.body)
  }

  useEffect(() => {
    if (composerOpen) {
      setSelected(null)
      setBody('')
      setError(null)
      setSending(false)
      setTimeout(() => textareaRef.current?.focus(), 120)
    }
  }, [composerOpen])

  useEffect(() => {
    if (!composerOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composerOpen])

  const hasWorm   = containsWorm(body)
  const charCount = body.length

  async function handleSend() {
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/trigger', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgeEnabled,
          useWorm:      selected === 'worm' || hasWorm,
          emailContent: body || undefined,
        }),
      })
      if (!res.ok) {
        if (res.status >= 502 && res.status <= 504) {
          setToast('Could not connect to workflow. Check backend is running.')
          onClose()
          return
        }
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      onClose()
    } catch (err: unknown) {
      if (err instanceof TypeError) {
        setToast('Could not connect to workflow. Check backend is running.')
        onClose()
        return
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSending(false)
    }
  }

  // Panel animation: slide-up on mobile, scale+fade on desktop
  const panelInitial = isMobile
    ? { y: '100%' }
    : { opacity: 0, scale: 0.95 }
  const panelAnimate = isMobile
    ? { y: 0 }
    : { opacity: 1, scale: 1 }
  const panelExit = isMobile
    ? { y: '100%' }
    : { opacity: 0, scale: 0.95 }

  const sendBg      = judgeEnabled ? '#006c49' : '#dc2626'
  const sendBgHover = judgeEnabled ? '#005a3c' : '#b91c1c'

  return (
    <AnimatePresence>
      {composerOpen && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed',
              inset:    0,
              zIndex:   50,
              backgroundColor: 'rgba(0,0,0,0.60)',
              backdropFilter:  'blur(4px)',
              display:         'flex',
              alignItems:      isMobile ? 'flex-end' : 'center',
              justifyContent:  'center',
              padding:         isMobile ? 0 : 20, // Add some padding on desktop to avoid touching edges
            }}
            onClick={onClose}
            aria-hidden="true"
          >
            {/* ── Panel ────────────────────────────────────────────────── */}
            <motion.div
              key="modal"
              initial={panelInitial}
              animate={panelAnimate}
              exit={panelExit}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="New Email"
              onClick={(e) => e.stopPropagation()}
              style={{
                position:        'relative', // Rely on flex container
                zIndex:          51,
                width:           '100%',
                maxWidth:        isMobile ? '100%' : 1000,
                backgroundColor: 'white',
                border:          '1px solid rgba(226,232,240,0.8)',
                borderRadius:    isMobile ? '16px 16px 0 0' : 16,
                padding:         32,
                maxHeight:       isMobile ? '90vh' : 'calc(100vh - 40px)',
                overflowY:       'auto',
                boxShadow:       '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              }}
            >
            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <h2
                  className="font-display"
                  style={{ fontWeight: 700, fontSize: 28, color: '#1e293b', margin: 0 }}
                >
                  New Email
                </h2>
                <p style={{ fontSize: 17, color: '#94a3b8', marginTop: 4 }}>
                  Select a template or compose your message
                </p>
              </div>

              {/* Close button */}
              <CloseButton onClose={onClose} />
            </div>

            {/* ── Template cards ─────────────────────────────────── */}
            <div
              style={{
                display:             'grid',
                gridTemplateColumns: '1fr 1fr',
                gap:                 16,
                marginTop:           20,
              }}
            >
              {EMAIL_TEMPLATES.map(tpl => (
                <TemplateCard
                  key={tpl.id}
                  id={tpl.id}
                  selected={selected === tpl.id}
                  onSelect={() => selectTemplate(tpl.id as TemplateId)}
                />
              ))}
            </div>

            {/* ── Textarea ───────────────────────────────────────── */}
            <div style={{ marginTop: 16 }}>
              <label
                className="font-mono"
                style={{
                  display:       'block',
                  fontSize:      15,
                  fontWeight:    700,
                  color:         '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom:  6,
                }}
              >
                Or compose your own:
              </label>

              <TextareaField
                ref={textareaRef}
                value={body}
                onChange={e => { setBody(e.target.value); setSelected(null) }}
              />

              {/* Below textarea row */}
              <div
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  marginTop:      4,
                }}
              >
                {/* Worm detector badge */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={hasWorm ? 'worm' : 'clean'}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                    className="font-mono"
                    style={{
                      borderRadius:    999,
                      border:          hasWorm
                        ? '1px solid rgba(227,30,36,0.3)'
                        : '1px solid rgba(58,163,53,0.3)',
                      backgroundColor: hasWorm ? 'rgba(220,38,38,0.08)' : 'rgba(0,108,73,0.08)',
                      color:           hasWorm ? '#dc2626' : '#006c49',
                      padding:         '4px 12px',
                      fontSize:        15,
                      fontWeight:      600,
                    }}
                  >
                    {hasWorm ? '🐛 Worm payload detected' : '✅ Clean content'}
                  </motion.span>
                </AnimatePresence>

                {/* Char count */}
                <span
                  className="font-mono"
                  style={{ fontSize: 15, color: '#94a3b8' }}
                >
                  {charCount.toLocaleString()} chars
                </span>
              </div>
            </div>

            {/* ── Judge status row ───────────────────────────────── */}
            <div
              style={{
                marginTop:       16,
                padding:         14,
                borderRadius:    8,
                border:          judgeEnabled
                  ? '1px solid rgba(0,108,73,0.2)'
                  : '1px solid rgba(220,38,38,0.2)',
                backgroundColor: judgeEnabled ? 'rgba(0,108,73,0.08)' : 'rgba(220,38,38,0.08)',
              }}
            >
              <span
                style={{
                  fontSize:   17,
                  color:      judgeEnabled ? '#006c49' : '#dc2626',
                  lineHeight: 1.4,
                }}
              >
                {judgeEnabled
                  ? '🧠 Judge Agent will scan this message'
                  : '⚠ Sending without Judge protection'}
              </span>
            </div>

            {/* ── Error ──────────────────────────────────────────── */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="font-mono"
                  style={{
                    overflow:        'hidden',
                    marginTop:       8,
                    borderRadius:    8,
                    border:          '1px solid #dc2626',
                    backgroundColor: 'rgba(220,38,38,0.08)',
                    padding:         '8px 12px',
                    fontSize:        11,
                    color:           '#dc2626',
                  }}
                >
                  ⚠ {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* ── Send button ────────────────────────────────────── */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || body.trim().length === 0}
              onMouseEnter={() => setSendHover(true)}
              onMouseLeave={() => setSendHover(false)}
              style={{
                marginTop:       16,
                width:           '100%',
                height:          56,
                borderRadius:    14,
                border:          'none',
                backgroundColor: sendHover && !sending ? sendBgHover : sendBg,
                color:           '#fff',
                fontSize:        22,
                fontWeight:      700,
                fontFamily:      'var(--font-outfit, system-ui)',
                cursor:          sending || body.trim().length === 0 ? 'not-allowed' : 'pointer',
                opacity:         sending || body.trim().length === 0 ? 0.6 : 1,
                transition:      'background-color 0.15s ease, opacity 0.15s ease',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                gap:             12,
              }}
            >
              {sending ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Sending...
                </>
              ) : (
                'Send Email to Mesh'
              )}
            </button>

            {/* ── Cancel ─────────────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border:     'none',
                  fontSize:   16,
                  color:      '#94a3b8',
                  cursor:     'pointer',
                  padding:    '6px 10px',
                }}
              >
                Cancel
              </button>
            </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Close button ──────────────────────────────────────────────────────────────

function CloseButton({ onClose }: { onClose: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClose}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Close"
      style={{
        width:           34,
        height:          34,
        borderRadius:    8,
        border:          'none',
        backgroundColor: hovered ? '#f1f5f9' : 'transparent',
        color:           '#94a3b8',
        cursor:          'pointer',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:      0,
        transition:      'background-color 0.15s ease',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="1" y1="1" x2="11" y2="11" />
        <line x1="11" y1="1" x2="1" y2="11" />
      </svg>
    </button>
  )
}

// ── Textarea with focus border ────────────────────────────────────────────────

const TextareaField = function TextareaField({
  value,
  onChange,
  ref,
}: {
  value:    string
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>
  ref:      React.RefObject<HTMLTextAreaElement | null>
}) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="Paste or type email content..."
      spellCheck={false}
      style={{
        width:           '100%',
        minHeight:       420,
        resize:          'none',
        borderRadius:    12,
        border:          `1px solid ${focused ? '#cbd5e1' : 'rgba(226,232,240,0.8)'}`,
        backgroundColor: '#f8fafc',
        padding:         16,
        fontFamily:      'var(--font-jetbrains-mono, monospace)',
        fontSize:        16,
        color:           '#475569',
        lineHeight:      1.7,
        outline:         'none',
        transition:      'border-color 0.15s ease',
        boxSizing:       'border-box',
      }}
    />
  )
}
