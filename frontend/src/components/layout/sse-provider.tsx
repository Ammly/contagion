'use client'

import { useEffect } from 'react'
import { useSSE } from '@/hooks/use-sse'
import { useSimulationStore } from '@/stores/simulation-store'

export function SSEProvider() {
  const { connected } = useSSE()
  const setSseConnected = useSimulationStore(s => s.setSseConnected)

  useEffect(() => {
    setSseConnected(connected)
  }, [connected, setSseConnected])

  return null
}
