import { EventEmitter } from 'events'
import type { SimulationEvent } from '@/types/events'

// ── Singleton EventEmitter (survives Next.js hot reload) ──────────────────────

const globalBus = globalThis as typeof globalThis & { __eventBus?: EventEmitter }

const ee = globalBus.__eventBus ?? new EventEmitter()
if (!globalBus.__eventBus) {
  globalBus.__eventBus = ee
  ee.setMaxListeners(100)
}

// ── Thin typed wrapper ────────────────────────────────────────────────────────

export const eventBus = {
  /** Broadcast an event to all active SSE subscribers. */
  emit(event: SimulationEvent): void {
    ee.emit('data', event)
  },

  /**
   * Register a subscriber. Returns an unsubscribe function.
   * Call the returned function to clean up on disconnect.
   */
  subscribe(handler: (event: SimulationEvent) => void): () => void {
    ee.on('data', handler)
    return () => ee.off('data', handler)
  },
}
