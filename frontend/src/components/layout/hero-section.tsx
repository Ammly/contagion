// Server component — no 'use client' needed

// ── Legend items ──────────────────────────────────────────────────────────────

type LegendItem = {
  label: string
  /** Inline dot style (colour + optional ring) */
  dot: React.CSSProperties
  /** Extra className on the dot span (e.g. animation) */
  dotClass?: string
  /** Label colour — defaults to var(--text-2) */
  labelColor?: string
}

const LEGEND: LegendItem[] = [
  {
    label: 'Idle',
    dot: { backgroundColor: '#4A6B4A' },
    labelColor: 'var(--text-3)',
  },
  {
    label: 'Processing',
    dot: { backgroundColor: 'var(--green)' },
    dotClass: 'pulse-green',
  },
  {
    label: 'Clean',
    dot: { backgroundColor: 'var(--green)' },
  },
  {
    label: 'Infected',
    dot: { backgroundColor: 'var(--red)' },
  },
  {
    label: 'Blocked',
    dot: { backgroundColor: 'var(--blue)' },
  },
  {
    label: 'Protected',
    // Solid green dot with a subtle ring
    dot: {
      backgroundColor: 'var(--green)',
      boxShadow: '0 0 0 2px var(--bg-raised), 0 0 0 3.5px var(--green)',
    },
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroSection() {
  return (
    <section
      style={{
        width: '100%',
        textAlign: 'center',
        paddingTop: 40,
        paddingBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Heading */}
      <h1
        className="font-display"
        style={{
          fontWeight: 800,
          fontSize: 'clamp(24px, 4vw, 36px)',
          lineHeight: 1.15,
          color: 'var(--text-1)',
          margin: 0,
        }}
      >
        Safaricom AI Agent Mesh
      </h1>

      {/* Subtitle */}
      <p
        style={{
          maxWidth: '42rem',
          margin: '12px auto 0',
          fontSize: 16,
          lineHeight: 1.6,
          color: 'var(--text-2)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        8 automated agents processing internal operations in real-time. This showcase
        demonstrates how an AI worm{' '}
        <span
          style={{
            color: 'var(--green)',
            fontStyle: 'italic',
            cursor: 'default',
          }}
        >
          (Morris&nbsp;II, arXiv:2403.02817)
        </span>{' '}
        can propagate silently through interconnected AI agents — and how a Judge Agent
        intercepts it before a single business system is reached.
      </p>

      {/* Status legend pill */}
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 8,
            paddingBottom: 8,
            justifyContent: 'center',
          }}
        >
          {LEGEND.map(({ label, dot, dotClass, labelColor }) => (
            <div
              key={label}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {/* Coloured dot */}
              <span
                className={dotClass}
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  flexShrink: 0,
                  ...dot,
                }}
              />
              {/* Label */}
              <span
                className="font-mono"
                style={{
                  fontSize: 14,
                  color: labelColor ?? 'var(--text-2)',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
