import type { Metadata } from 'next'
import { AgentPipeline } from '@/components/pipeline/agent-pipeline'
import { CustomerResponsePanel } from '@/components/pipeline/customer-response-panel'
import { ControlPanel } from '@/components/controls/control-panel'

import { EventLog } from '@/components/event-log/event-log'
import { CompletionBanner } from '@/components/panels/completion-banner'
import { GlobalModals } from '@/components/layout/global-modals'

export const metadata: Metadata = {
  title: 'CONTAGION — Safaricom AI Mesh Security Demo',
  description: 'Live demonstration of Morris II AI worm propagation and detection in an 8-agent pipeline.',
}

const F = '"Manrope", system-ui, sans-serif'

export default function Home() {
  return (
    <>
      {/* ── Fixed left sidebar ──────────────────────────────────────── */}
      <aside
        style={{
          position:        'fixed',
          top:             72,
          left:            0,
          bottom:          0,
          width:           320,
          backgroundColor: '#f1f5f9',
          zIndex:          40,
          overflowY:       'auto',
          display:         'flex',
          flexDirection:   'column',
        }}
      >
        <ControlPanel />
      </aside>

      {/* ── Scrollable main content ─────────────────────────────────── */}
      <main
        style={{
          marginLeft:    320,
          height:        'calc(100vh - 72px)',
          overflowY:     'auto',
          padding:       40,
          display:       'flex',
          flexDirection: 'column',
          gap:           36,
          fontFamily:    F,
          backgroundColor: '#f7f9fb',
        }}
      >
        {/* ── Page header ─────────────────────────────────────────── */}
        <section>
          <h2
            style={{
              fontSize:      38,
              fontWeight:    800,
              color:         '#1e293b',
              letterSpacing: '-0.02em',
              margin:        0,
              lineHeight:    1.2,
            }}
          >
            MODEL AS A JUDGE{' '}
            <span style={{ color: '#94a3b8', fontWeight: 300 }}>Showcase</span>
          </h2>
          <p
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        8,
              fontSize:   17,
              color:      '#3c4a42',
              margin:     '6px 0 0',
            }}
          >
            <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
              <span
                className="pulse-green"
                style={{
                  position:        'absolute',
                  inset:           0,
                  borderRadius:    '50%',
                  backgroundColor: '#006c49',
                  opacity:         0.75,
                }}
              />
              <span
                style={{
                  position:        'relative',
                  display:         'inline-block',
                  width:           10,
                  height:          10,
                  borderRadius:    '50%',
                  backgroundColor: '#006c49',
                }}
              />
            </span>
            Monitoring 9 Active Autonomous Agents
          </p>
        </section>

        {/* ── Agent pipeline ──────────────────────────────────────── */}
        <section style={{ position: 'relative' }}>
          <AgentPipeline />
        </section>

        {/* ── Pipeline response ───────────────────────────────────── */}
        <CustomerResponsePanel />

        {/* ── Completion banner ───────────────────────────────────── */}
        <CompletionBanner />

        {/* ── Real-time event log ─────────────────────────────────── */}
        <EventLog />
      </main>

      <GlobalModals />
    </>
  )
}
