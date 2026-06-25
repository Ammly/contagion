'use client'

import { useEffect, useRef } from 'react'
import { useSimulationStore } from '@/stores/simulation-store'

// Fires global keyboard shortcuts.
// Mounted once at page level — delegates E and R to the ControlPanel
// by dispatching custom events the panel can listen to.
export function KeyboardShortcuts() {
  const running    = useSimulationStore(s => s.running)
  const judgeEnabled = useSimulationStore(s => s.judgeEnabled)
  const setJudge   = useSimulationStore(s => s.setJudgeEnabled)
  const reset      = useSimulationStore(s => s.reset)
  const runningRef = useRef(running)

  useEffect(() => { runningRef.current = running }, [running])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore when focus is inside an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key.toLowerCase()) {
        case 'j':
          if (!runningRef.current) {
            setJudge(!useSimulationStore.getState().judgeEnabled)
          }
          break
        case 'e':
          if (!runningRef.current) {
            useSimulationStore.getState().setComposerOpen(true)
          }
          break
        case 'r':
          if (!runningRef.current) {
            window.dispatchEvent(new CustomEvent('contagion:reset'))
          }
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setJudge])

  return null
}
