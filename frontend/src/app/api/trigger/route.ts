import { NextRequest, NextResponse } from 'next/server'
import { eventBus } from '@/lib/event-bus'
import { db } from '@/lib/db'

const ADK_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ??
  process.env.N8N_WEBHOOK_URL ??
  'http://localhost:8000/webhook/contagion-trigger'

// Shared execId slot — same pattern as webhook/route.ts
const g = globalThis as typeof globalThis & { __execId?: string }

export async function POST(req: NextRequest) {
  let body: { judgeEnabled?: boolean; useWorm?: boolean; emailContent?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const res = await fetch(ADK_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(8_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json(
        { ok: false, error: `ADK backend returned ${res.status}`, detail: text },
        { status: 502 },
      )
    }

    // ── Emit simulation_start so the dashboard transitions to running ──────
    const startEvent = {
      id:           `${Date.now()}-start`,
      timestamp:    Date.now(),
      event:        'simulation_start' as const,
      message:      'Simulation started — email dispatched to Google ADK pipeline.',
      isWorm:       body.useWorm      ?? false,
      judgeEnabled: body.judgeEnabled ?? false,
      ...(body.emailContent && { emailContent: body.emailContent }),
    }
    eventBus.emit(startEvent)

    // ── Create the DB execution row (background — never blocks the response) ─
    db.execution.create({
      data: {
        isWorm:       Boolean(body.useWorm),
        judgeEnabled: Boolean(body.judgeEnabled),
        emailContent: typeof body.emailContent === 'string' ? body.emailContent : null,
        status:       'running',
      },
    })
      .then(exec  => { g.__execId = exec.id })
      .catch(err  => console.error('[trigger] DB create error:', err))

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}

