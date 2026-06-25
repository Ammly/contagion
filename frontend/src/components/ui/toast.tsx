'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulation-store'

const AUTO_DISMISS_MS = 5_000

export function Toast() {
  const toast    = useSimulationStore(s => s.toast)
  const setToast = useSimulationStore(s => s.setToast)

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), AUTO_DISMISS_MS)
    return () => clearTimeout(id)
  }, [toast, setToast])

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-orange-200 bg-white px-4 py-3.5 shadow-xl"
          role="alert"
          aria-live="polite"
        >
          <span className="mt-px flex-shrink-0 text-base leading-none">⚠</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0F1F0F]">Connection error</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#4A6A4A]">{toast}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="flex-shrink-0 text-[#8A9E8A] transition-colors hover:text-[#0F1F0F]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
