import { NextResponse } from 'next/server'
import { eventBus } from '@/lib/event-bus'

export async function POST() {
  eventBus.emit({
    id: `reset-${Date.now()}`,
    timestamp: Date.now(),
    event: 'reset',
    message: 'Simulation reset',
  })

  return NextResponse.json({ ok: true })
}
