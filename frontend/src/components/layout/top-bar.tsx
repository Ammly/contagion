'use client'

import { Moon, Sun } from 'lucide-react'
import { LiveIndicator } from './live-indicator'
import { useTheme } from '@/hooks/use-theme'

export function TopBar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Left — brand + demo label */}
        <div className="flex items-center gap-3">
          {/* Safaricom logo */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: '#DC2626' }}
            aria-label="Safaricom"
          >
            S
          </div>
          <div className="leading-none">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              Safaricom
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>AI Ops</p>
          </div>

          {/* Divider */}
          <div className="hidden h-6 w-px sm:block" style={{ backgroundColor: 'var(--border)' }} />

          {/* Demo badge */}
          <div className="hidden leading-none sm:block">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--green)' }}>
              CONTAGION DEMO
            </p>
            <p className="font-mono text-[10px]" style={{ color: 'var(--text-3)' }}>DECODE 2026</p>
          </div>
        </div>

        {/* Right — live status + theme toggle */}
        <div className="flex items-center gap-3">
          <LiveIndicator />

          {/* Sun / Moon toggle */}
          <div
            className="flex items-center overflow-hidden rounded-lg border"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* Light */}
            <button
              onClick={toggleTheme}
              aria-label="Switch to light mode"
              className="flex h-8 w-8 items-center justify-center transition-colors"
              style={{
                backgroundColor: theme === 'light' ? 'var(--bg-raised)' : 'transparent',
                color: theme === 'light' ? 'var(--green)' : 'var(--text-3)',
              }}
            >
              <Sun size={13} />
            </button>
            {/* Dark */}
            <button
              onClick={toggleTheme}
              aria-label="Switch to dark mode"
              className="flex h-8 w-8 items-center justify-center transition-colors"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-raised)' : 'transparent',
                color: theme === 'dark' ? 'var(--green)' : 'var(--text-3)',
              }}
            >
              <Moon size={13} />
            </button>
          </div>
        </div>

      </div>
    </header>
  )
}
