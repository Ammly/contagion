'use client'

import { Bell, Settings } from 'lucide-react'

const F = '"Manrope", system-ui, sans-serif'

export default function TopNav() {
  return (
    <header
      style={{
        position:        'fixed',
        top:             0,
        left:            0,
        right:           0,
        zIndex:          50,
        height:          72,
        backgroundColor: 'rgba(248, 250, 252, 0.85)',
        backdropFilter:  'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow:       '0 1px 0 rgba(148, 163, 184, 0.25)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0 28px',
        fontFamily:      F,
      }}
    >
      {/* Left: brand + nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <h1
          style={{
            fontSize:      26,
            fontWeight:    800,
            color:         '#1e293b',
            letterSpacing: '-0.02em',
            margin:        0,
          }}
        >
          CONTAGION
        </h1>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              color:         '#0f172a',
              fontWeight:    600,
              fontSize:      16,
              borderBottom:  '2px solid #475569',
              paddingBottom: 2,
              paddingTop:    4,
              cursor:        'default',
            }}
          >
            Agent Mesh
          </span>
          <span
            style={{
              color:        '#94a3b8',
              fontWeight:   500,
              fontSize:     16,
              padding:      '4px 12px',
              borderRadius: 8,
              cursor:       'pointer',
            }}
          >
            History
          </span>
        </nav>
      </div>

      {/* Right: icons + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Bell with notification dot */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              padding:         8,
              borderRadius:    999,
              background:      'transparent',
              border:          'none',
              cursor:          'pointer',
              color:           '#475569',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
            }}
          >
            <Bell size={22} />
          </button>
          <span
            style={{
              position:        'absolute',
              top:             8,
              right:           8,
              width:           8,
              height:          8,
              borderRadius:    '50%',
              backgroundColor: '#dc2626',
              border:          '2px solid #f8fafc',
            }}
          />
        </div>

        <button
          style={{
            padding:        8,
            borderRadius:   999,
            background:     'transparent',
            border:         'none',
            cursor:         'pointer',
            color:          '#475569',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          <Settings size={22} />
        </button>

        {/* Avatar initials */}
        <div
          style={{
            width:           38,
            height:          38,
            borderRadius:    '50%',
            backgroundColor: '#e2e8f0',
            border:          '1px solid rgba(187,202,191,0.3)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            flexShrink:      0,
            marginLeft:      4,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>SO</span>
        </div>
      </div>
    </header>
  )
}
