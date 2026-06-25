import type { AgentId } from '@/lib/constants'

export type { AgentId }

export type AgentStatus =
  | 'idle'
  | 'processing'
  | 'clean'
  | 'infected'
  | 'blocked'
  | 'protected'

// ── Per-agent state ────────────────────────────────────────────────────────────

export interface AgentState {
  id: AgentId

  status: AgentStatus

  /** Structured output object from the agent's Output Parser */
  agentOutput: Record<string, unknown> | null

  /** One-line summary extracted from agentOutput.summary */
  summary: string | null

  /** Whether a worm payload was found in this agent's output */
  wormFound: boolean

  /** 0 = clean, 1-8 = which generation of worm propagation */
  generation: number

  /** Timestamp when this agent started processing */
  startedAt: number | null

  /** Timestamp when agentOutput was received */
  completedAt: number | null

  /** Agent-specific extra data (exfiltrated items, tool calls, etc.) */
  extras: Record<string, unknown>
}

// ── SSE event envelope ────────────────────────────────────────────────────────

export type SimulationEvent = {
  id:        string
  timestamp: number
  event:
    | 'simulation_start'
    | 'agent_processing'
    | 'agent_clean'
    | 'agent_infected'
    | 'judge_scanning'
    | 'judge_allowed'
    | 'shield_alert'
    | 'worm_blocked'
    | 'scan_complete'
    | 'reset'
  message: string

  // Agent targeting
  agentId?:     string
  generation?:  number
  exfiltrated?: string[]

  // Judge fields
  reasoning?:        string
  confidence?:       number
  indicatorsFound?:  string[]
  verdict?:          string

  // Simulation metadata (simulation_start)
  isWorm?:        boolean
  judgeEnabled?:  boolean
  shieldEnabled?: boolean
  emailContent?:  string

  // Agent output payload (agent_clean, agent_infected)
  agentOutput?: Record<string, unknown>
  summary?:     string
  wormFound?:   boolean
  extras?:      Record<string, unknown>

  // Final pipeline output (scan_complete)
  customerResponse?: string
  archiveRef?:       string
  pipelineSummary?:  string
}

/** Backward-compat alias */
export type WorkflowEvent = SimulationEvent

// ── Simulation state ──────────────────────────────────────────────────────────

export interface SimulationState {
  // Lifecycle
  running:     boolean
  startedAt:   number | null
  completedAt: number | null
  outcome:     'clean' | 'infected' | 'blocked' | null

  // What was sent
  isWorm:        boolean | null
  judgeEnabled:  boolean
  emailContent:  string | null

  // Judge Agent (runs before the pipeline)
  judgeStatus: 'idle' | 'scanning' | 'cleared' | 'blocked'
  judgeResult: {
    infected:        boolean
    confidence:      number
    reasoning:       string
    indicatorsFound: string[]
    verdict:         string
  } | null

  // 8 business agents (keyed by AgentId)
  agents: Record<AgentId, AgentState>

  // Live event log (newest first)
  events: SimulationEvent[]

  // Final output from File Agent / scan_complete
  customerResponse: string | null
  archiveRef:       string | null
  pipelineSummary:  string | null

  // UI state
  selectedAgent: AgentId | null
  activePanel:   'pipeline' | 'response' | null

  // Worm propagation tracking
  totalExfiltrated: string[]
  maxGeneration:    number
  infectedAgents:   AgentId[]
}
