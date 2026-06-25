'use client'

import { useSimulationStore } from '@/stores/simulation-store'
import { DataExposure } from './data-exposure'
import { EventLog } from '@/components/event-log/event-log'

export function BottomRow() {
  const selectedAgent = useSimulationStore(s => s.selectedAgent)

  // Hide when agent detail panel is open to give it room
  if (selectedAgent) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '35fr 65fr',
        gap: 16,
        alignItems: 'stretch',
      }}
    >
      {/* Left: Data Exposure */}
      <DataExposure />

      {/* Right: Event Log */}
      <EventLog />
    </div>
  )
}
