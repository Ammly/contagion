'use client'

import { useEffect, useRef, useState } from 'react'
import { useSimulationStore } from '@/stores/simulation-store'

const RECONNECT_DELAY = 3_000

export function useSSE(): { connected: boolean } {
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmounted = useRef(false)

  useEffect(() => {
    unmounted.current = false

    function connect() {
      if (unmounted.current) return

      const es = new EventSource('/api/events')
      esRef.current = es

      es.onopen = () => {
        if (!unmounted.current) setConnected(true)
      }

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data)
          // Ignore keep-alive pings
          if (event.event === 'ping') return
          useSimulationStore.getState().applyEvent(event)
        } catch {
          // Malformed frame — ignore
        }
      }

      es.onerror = () => {
        if (unmounted.current) return
        setConnected(false)
        es.close()
        esRef.current = null
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
      }
    }

    connect()

    return () => {
      unmounted.current = true
      if (reconnectTimer.current !== null) clearTimeout(reconnectTimer.current)
      esRef.current?.close()
      esRef.current = null
    }
  }, [])

  return { connected }
}
