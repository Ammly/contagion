import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ── Safaricom brand scale (fixed, not theme-aware) ──────────────
      colors: {
        safaricom: {
          50:  '#F0FAF0',
          100: '#DCF3DB',
          200: '#B8E5B6',
          300: '#84CE80',
          400: '#52B34D',
          500: '#3AA335',
          600: '#2D8028',
          700: '#1F5C1B',
          800: '#143D12',
          900: '#0A1F09',
          950: '#061209',
        },

        // ── Theme-aware semantic tokens (resolve via CSS var) ─────────
        //    Used as: bg-base, bg-surface, text-text-1, border-border, …

        base:    'var(--bg-base)',
        surface: 'var(--bg-surface)',
        raised:  'var(--bg-raised)',
        input:   'var(--bg-input)',

        border: {
          DEFAULT: 'var(--border)',
          bright:  'var(--border-bright)',
        },

        // text-* would clash with Tailwind's own text colours,
        // so we namespace these under `content`
        content: {
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
        },

        brand: {
          green:    'var(--green)',
          'green-dk': 'var(--green-dk)',
          red:      'var(--red)',
          amber:    'var(--amber)',
          blue:     'var(--blue)',
        },
      },

      // ── Typography ─────────────────────────────────────────────────
      fontFamily: {
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans:    ['system-ui', 'sans-serif'],
      },

      // ── Background image helpers for glow/overlay colours ──────────
      backgroundImage: {
        'green-glow': 'radial-gradient(circle, var(--green-glow), transparent 70%)',
      },
    },
  },
  plugins: [],
}

export default config
