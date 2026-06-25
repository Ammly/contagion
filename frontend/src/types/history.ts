import type { Execution, AgentEvent } from '@prisma/client'

export type ExecutionWithEvents = Execution & {
  events: AgentEvent[]
}

export type ExecutionSummary = Pick<
  Execution,
  | 'id' | 'createdAt' | 'completedAt' | 'isWorm' | 'judgeEnabled'
  | 'status' | 'outcome' | 'maxGeneration' | 'agentsInfected'
  | 'durationMs' | 'totalEvents' | 'emailSubject' | 'emailFrom'
>
