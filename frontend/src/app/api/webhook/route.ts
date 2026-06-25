import { NextRequest, NextResponse } from 'next/server'
import { eventBus } from '@/lib/event-bus'
import { db } from '@/lib/db'
import type { SimulationEvent } from '@/types/events'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ── Execution-ID tracking (survives hot reload, resets on simulation_start) ───

const g = globalThis as typeof globalThis & { __execId?: string }

// ── Async DB persistence ───────────────────────────────────────────────────────

async function persistEvent(
  body: Record<string, unknown>,
  event: SimulationEvent,
): Promise<void> {
  // ── simulation_start: create a new Execution row ──────────────────────────
  if (event.event === 'simulation_start') {
    const exec = await db.execution.create({
      data: {
        isWorm:       Boolean(body.isWorm),
        judgeEnabled: Boolean(body.shieldEnabled ?? body.judgeEnabled),
        emailContent: typeof body.emailContent === 'string' ? body.emailContent : null,
        status:       'running',
      },
    })
    g.__execId = exec.id
    return
  }

  const execId = g.__execId
  if (!execId) return

  // ── per-event AgentEvent row ──────────────────────────────────────────────
  await db.agentEvent.create({
    data: {
      executionId:     execId,
      event:           event.event,
      agentId:         event.agentId ?? null,
      message:         event.message,
      timestamp:       BigInt(event.timestamp),
      generation:      event.generation    ?? null,
      wormFound:       event.wormFound     ?? false,
      exfiltrated:     event.exfiltrated?.length
        ? JSON.stringify(event.exfiltrated)
        : null,
      reasoning:       event.reasoning     ?? null,
      confidence:      event.confidence    ?? null,
      infected:
        event.event === 'shield_alert'  ? true  :
        event.event === 'judge_allowed' ? false : null,
      indicatorsFound: event.indicatorsFound?.length
        ? JSON.stringify(event.indicatorsFound)
        : null,
      agentOutput:     event.agentOutput
        ? JSON.stringify(event.agentOutput)
        : null,
      crmDataAccessed: typeof body.crmDataAccessed === 'string'
        ? body.crmDataAccessed
        : null,
      toolUsed:        Boolean(body.toolUsed),
    },
  })

  // ── terminal events: finalise the Execution row ───────────────────────────
  if (event.event === 'scan_complete' || event.event === 'worm_blocked') {
    const [infectedCount, genAgg, totalCount, execRow] = await Promise.all([
      db.agentEvent.count({ where: { executionId: execId, event: 'agent_infected' } }),
      db.agentEvent.aggregate({
        where: { executionId: execId },
        _max:  { generation: true },
      }),
      db.agentEvent.count({ where: { executionId: execId } }),
      db.execution.findUnique({ where: { id: execId }, select: { createdAt: true } }),
    ])

    await db.execution.update({
      where: { id: execId },
      data:  {
        status:         'complete',
        outcome:
          event.event === 'worm_blocked' ? 'blocked' :
          event.isWorm                   ? 'infected' : 'clean',
        completedAt:    new Date(),
        agentsInfected: infectedCount,
        maxGeneration:  genAgg._max.generation ?? 0,
        totalEvents:    totalCount,
        durationMs:     execRow
          ? Date.now() - execRow.createdAt.getTime()
          : null,
      },
    })

    g.__execId = undefined
  }
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  if (typeof body.event !== 'string' || typeof body.message !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'Missing required fields: event, message' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  // Normalise agentOutput: parse markdown-fenced JSON strings → always object | null
  function parseAgentOutput(raw: unknown): Record<string, unknown> | null {
    if (raw === null || raw === undefined) return null
    if (typeof raw === 'object') return raw as Record<string, unknown>
    if (typeof raw === 'string') {
      // Strip ``` json ``` code fences that n8n agents sometimes wrap output in
      const stripped = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim()
      try {
        const parsed = JSON.parse(stripped)
        if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
      } catch { /* fall through */ }
      return { raw }
    }
    return null
  }
  const agentOutput = parseAgentOutput(body.agentOutput)

  const event: SimulationEvent = {
    id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: typeof body.timestamp === 'number' ? body.timestamp : Date.now(),
    event:     body.event as SimulationEvent['event'],
    message:   body.message as string,

    // Agent targeting
    ...(body.agentId    !== undefined && { agentId:    String(body.agentId) }),
    ...(body.generation !== undefined && { generation: Number(body.generation) }),
    ...(Array.isArray(body.exfiltrated) && { exfiltrated: body.exfiltrated as string[] }),

    // Simulation metadata
    ...(body.isWorm         !== undefined && { isWorm:        Boolean(body.isWorm) }),
    ...(body.judgeEnabled   !== undefined && { judgeEnabled:  Boolean(body.judgeEnabled) }),
    ...(body.shieldEnabled  !== undefined && { shieldEnabled: Boolean(body.shieldEnabled) }),
    ...(typeof body.emailContent === 'string' && { emailContent: body.emailContent }),

    // Agent output
    ...(agentOutput !== null && { agentOutput }),
    ...(typeof body.summary   === 'string'  && { summary:   body.summary }),
    ...(body.wormFound !== undefined         && { wormFound: Boolean(body.wormFound) }),

    // Judge fields
    ...(typeof body.reasoning         === 'string'  && { reasoning:  body.reasoning }),
    ...(body.confidence               !== undefined  && { confidence: Number(body.confidence) }),
    ...(Array.isArray(body.indicators_found)         && { indicatorsFound: body.indicators_found as string[] }),
    ...(typeof body.verdict           === 'string'  && { verdict:    body.verdict }),

    // Pipeline output (scan_complete)
    ...(typeof body.customerResponse  === 'string'  && { customerResponse: body.customerResponse }),
    ...(typeof body.archiveRef        === 'string'  && { archiveRef:       body.archiveRef }),
    ...(typeof body.pipelineSummary   === 'string'  && { pipelineSummary:  body.pipelineSummary }),

    // Agent-specific extras (passed through on agentOutput object if present)
    ...(Object.keys({
      emailType:        body.emailType,
      priority:         body.priority,
      anomalyFlags:     body.anomalyFlags,
      paymentRef:       body.paymentRef,
      approvalStatus:   body.approvalStatus,
      invoiceRef:       body.invoiceRef,
      meetingRef:       body.meetingRef,
      proposedDate:     body.proposedDate,
      techRef:          body.techRef,
      systemsAffected:  body.systemsAffected,
      hrRef:            body.hrRef,
      hrAction:         body.hrAction,
      company:          body.company,
      tier:             body.tier,
      relationshipScore: body.relationshipScore,
      paymentStatus:    body.paymentStatus,
      crmDataAccessed:  body.crmDataAccessed,
      toolUsed:         body.toolUsed,
      recommendedArchivePath: body.recommendedArchivePath,
      classification:   body.classification,
    }).filter(k => body[k] !== undefined).length > 0 && {
      extras: Object.fromEntries(
        Object.entries({
          emailType:        body.emailType,
          priority:         body.priority,
          anomalyFlags:     body.anomalyFlags,
          paymentRef:       body.paymentRef,
          approvalStatus:   body.approvalStatus,
          invoiceRef:       body.invoiceRef,
          meetingRef:       body.meetingRef,
          proposedDate:     body.proposedDate,
          techRef:          body.techRef,
          systemsAffected:  body.systemsAffected,
          hrRef:            body.hrRef,
          hrAction:         body.hrAction,
          company:          body.company,
          tier:             body.tier,
          relationshipScore: body.relationshipScore,
          paymentStatus:    body.paymentStatus,
          crmDataAccessed:  body.crmDataAccessed,
          toolUsed:         body.toolUsed,
          recommendedArchivePath: body.recommendedArchivePath,
          classification:   body.classification,
        }).filter(([, v]) => v !== undefined)
      ),
    }),
  }

  // Broadcast to all SSE clients immediately — never block n8n
  eventBus.emit(event)

  // Persist to DB in the background — errors are logged but never re-thrown
  persistEvent(body, event).catch(err =>
    console.error('[webhook] DB persist error:', err),
  )

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS })
}
