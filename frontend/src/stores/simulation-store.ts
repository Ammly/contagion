import { create } from 'zustand'
import type { SimulationEvent, SimulationState, AgentId, AgentState } from '@/types/events'

// ── Agent order & metadata ─────────────────────────────────────────────────────

export const AGENT_ORDER: AgentId[] = [
  'email', 'calendar', 'code', 'finance', 'hr', 'crm', 'search', 'file',
]

export const AGENT_META: Record<AgentId, { label: string; icon: string; description: string }> = {
  email:    { label: 'Email Agent',    icon: '📨', description: 'Classifies and routes incoming emails' },
  calendar: { label: 'Calendar Agent', icon: '📅', description: 'Schedules meetings and manages calendar' },
  code:     { label: 'Code Agent',     icon: '💻', description: 'Queues system integrations and API calls' },
  finance:  { label: 'Finance Agent',  icon: '💰', description: 'Processes invoices and payment approvals' },
  hr:       { label: 'HR Agent',       icon: '👤', description: 'Handles personnel actions and record updates' },
  crm:      { label: 'CRM Agent',      icon: '🤝', description: 'Looks up vendor and customer records' },
  search:   { label: 'Search Agent',   icon: '🔍', description: 'References policies and archive paths' },
  file:     { label: 'File Agent',     icon: '📁', description: 'Archives documents and generates response' },
}

// ── Initial state factories ────────────────────────────────────────────────────

function initialAgentState(id: AgentId): AgentState {
  return {
    id,
    status:      'idle',
    agentOutput: null,
    summary:     null,
    wormFound:   false,
    generation:  0,
    startedAt:   null,
    completedAt: null,
    extras:      {},
  }
}

function initialAgents(): Record<AgentId, AgentState> {
  return Object.fromEntries(
    AGENT_ORDER.map(id => [id, initialAgentState(id)]),
  ) as Record<AgentId, AgentState>
}

const INITIAL_STATE: SimulationState = {
  running:          false,
  startedAt:        null,
  completedAt:      null,
  outcome:          null,
  isWorm:           null,
  judgeEnabled:     false,
  emailContent:     null,
  judgeStatus:      'idle',
  judgeResult:      null,
  agents:           initialAgents(),
  events:           [],
  customerResponse: null,
  archiveRef:       null,
  pipelineSummary:  null,
  selectedAgent:    null,
  activePanel:      null,
  totalExfiltrated: [],
  maxGeneration:    0,
  infectedAgents:   [],
}

// ── Store interface ────────────────────────────────────────────────────────────

interface SimulationStore extends SimulationState {
  // Backward-compat flat fields for existing panel components
  judgeReasoning: string | null
  judgeConfidence: number | null

  // SSE connection UI
  sseConnected: boolean
  setSseConnected: (connected: boolean) => void

  // Email composer UI
  composerOpen: boolean
  setComposerOpen: (open: boolean) => void

  // Toast notifications
  toast: string | null
  setToast: (msg: string | null) => void

  // Core event handler
  handleSSEEvent: (event: SimulationEvent) => void
  /** @deprecated use handleSSEEvent — kept for backward compat with use-sse.ts */
  applyEvent: (event: SimulationEvent) => void

  // Optimistic / manual actions
  setAgentProcessing: (agentId: AgentId) => void
  selectAgent: (agentId: AgentId | null) => void
  setActivePanel: (panel: 'pipeline' | 'response' | null) => void
  setJudgeEnabled: (enabled: boolean) => void

  reset: () => void
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  ...INITIAL_STATE,

  // Backward-compat derived fields
  judgeReasoning:  null,
  judgeConfidence: null,

  // UI state
  sseConnected: false,
  setSseConnected: (connected) => set({ sseConnected: connected }),

  composerOpen: false,
  setComposerOpen: (open) => set({ composerOpen: open }),

  toast: null,
  setToast: (msg) => set({ toast: msg }),

  setJudgeEnabled:  (enabled) => set({ judgeEnabled: enabled }),
  selectAgent:      (agentId) => set({ selectedAgent: agentId }),
  setActivePanel:   (panel)   => set({ activePanel: panel }),

  setAgentProcessing: (agentId) => set(s => ({
    agents: {
      ...s.agents,
      [agentId]: { ...s.agents[agentId], status: 'processing', startedAt: Date.now() },
    },
  })),

  reset: () => set({
    ...INITIAL_STATE,
    agents:          initialAgents(),
    judgeReasoning:  null,
    judgeConfidence: null,
  }),

  handleSSEEvent: (event) => {
    // Prepend so index 0 is always the newest (event-log renders [0] first)
    set(s => ({ events: [event, ...s.events].slice(0, 200) }))

    switch (event.event) {
      // ── Simulation lifecycle ──────────────────────────────────────────────
      case 'simulation_start': {
        const je = event.shieldEnabled ?? event.judgeEnabled ?? false
        set({
          ...INITIAL_STATE,
          agents:          initialAgents(),
          judgeReasoning:  null,
          judgeConfidence: null,
          running:         true,
          startedAt:       Date.now(),
          isWorm:          event.isWorm   ?? null,
          judgeEnabled:    je,
          emailContent:    event.emailContent ?? null,
          // Show judge as scanning immediately if enabled
          judgeStatus:     je ? 'scanning' : 'idle',
        })
        break
      }

      // ── Agent lifecycle ───────────────────────────────────────────────────
      case 'agent_processing':
        if (event.agentId) {
          const id = event.agentId as AgentId
          // n8n sends agent_processing as the terminal "clean" event (with agentOutput).
          // If output is present the agent finished cleanly; otherwise it just started.
          if (event.agentOutput) {
            set(s => ({
              agents: {
                ...s.agents,
                [id]: {
                  ...s.agents[id],
                  status:      'clean',
                  agentOutput: event.agentOutput ?? null,
                  summary:     event.summary ?? null,
                  completedAt: Date.now(),
                  extras:      event.extras ?? {},
                },
              },
            }))
          } else {
            set(s => ({
              agents: {
                ...s.agents,
                [id]: { ...s.agents[id], status: 'processing', startedAt: Date.now() },
              },
            }))
          }
        }
        break

      case 'agent_clean':
        if (event.agentId) {
          const id = event.agentId as AgentId
          set(s => ({
            agents: {
              ...s.agents,
              [id]: {
                ...s.agents[id],
                status:      'clean',
                agentOutput: event.agentOutput ?? null,
                summary:     event.summary ?? null,
                completedAt: Date.now(),
                extras:      event.extras ?? {},
              },
            },
          }))
        }
        break

      case 'agent_infected': {
        if (!event.agentId) break
        const id  = event.agentId as AgentId
        const gen = event.generation ?? 0
        set(s => {
          const newInfected = s.infectedAgents.includes(id)
            ? s.infectedAgents
            : [...s.infectedAgents, id]
          return {
            agents: {
              ...s.agents,
              [id]: {
                ...s.agents[id],
                status:      'infected',
                wormFound:   true,
                generation:  gen,
                agentOutput: event.agentOutput ?? null,
                summary:     event.summary ?? null,
                completedAt: Date.now(),
                extras: {
                  exfiltrated: event.exfiltrated ?? [],
                  ...(event.extras ?? {}),
                },
              },
            },
            totalExfiltrated: [
              ...new Set([...s.totalExfiltrated, ...(event.exfiltrated ?? [])]),
            ],
            maxGeneration: Math.max(s.maxGeneration, gen),
            infectedAgents: newInfected,
          }
        })
        break
      }

      // ── Judge ─────────────────────────────────────────────────────────────
      case 'judge_scanning':
        set({ judgeStatus: 'scanning' })
        break

      case 'judge_allowed': {
        const result = {
          infected:        false,
          confidence:      event.confidence ?? 0,
          reasoning:       event.reasoning ?? '',
          indicatorsFound: event.indicatorsFound ?? [],
          verdict:         event.verdict ?? 'CLEAN',
        }
        set({
          judgeStatus:     'cleared',
          judgeResult:     result,
          judgeReasoning:  result.reasoning,
          judgeConfidence: result.confidence,
        })
        if (event.agentId) {
          const id = event.agentId as AgentId
          set(s => ({
            agents: {
              ...s.agents,
              [id]: { ...s.agents[id], status: 'protected' },
            },
          }))
        }
        break
      }

      case 'shield_alert': {
        const result = {
          infected:        true,
          confidence:      event.confidence ?? 0,
          reasoning:       event.reasoning ?? '',
          indicatorsFound: event.indicatorsFound ?? [],
          verdict:         event.verdict ?? 'THREAT_DETECTED',
        }
        set({
          judgeStatus:     'blocked',
          judgeResult:     result,
          judgeReasoning:  result.reasoning,
          judgeConfidence: result.confidence,
        })
        break
      }

      // ── Terminal events ───────────────────────────────────────────────────
      case 'worm_blocked':
        if (event.agentId) {
          const id = event.agentId as AgentId
          set(s => ({
            agents: {
              ...s.agents,
              [id]: { ...s.agents[id], status: 'blocked' },
            },
          }))
        }
        set({ running: false, completedAt: Date.now(), outcome: 'blocked' })
        break

      case 'scan_complete':
        set({
          running:          false,
          completedAt:      Date.now(),
          // n8n sends wormFound (not isWorm) in the scan_complete payload
          outcome:          (event.wormFound ?? event.isWorm) ? 'infected' : 'clean',
          customerResponse: event.customerResponse ?? null,
          archiveRef:       event.archiveRef ?? null,
          pipelineSummary:  event.pipelineSummary ?? null,
        })
        break

      case 'reset':
        get().reset()
        break
    }
  },

  applyEvent: (event) => get().handleSSEEvent(event),
}))
