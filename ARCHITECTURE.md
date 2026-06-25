# CONTAGION: Architecture & Design

Architectural documentation for the zero trust AI agent security simulation showcase.

## 1. System Architecture

The workflow is organized into three distinct phases:

```
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 1: ENTRY & INGESTION                                       │
│  FastAPI Trigger Webhook -> Respond 200 OK -> Prepare Payload     │
│  * Receives trigger options (judgeEnabled, useWorm, customEmail)  │
│  * Immediately responds 200 OK to the client                      │
│  * Spawns simulation thread to process asynchronously             │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 2: SECURITY GATE                                           │
│  Judge Enabled Check -> Gemini 2.5 Pro Security Scan             │
│  * Evaluates text for prompt injection and self-replication keys │
│  * Returns deterministic classification verdict in JSON format   │
│  * Confirmed threat: fires quarantine callback, terminates flow  │
│  * Clean input: forwards message downstream to the agent pipeline│
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 3: PROCESSING PIPELINE                                     │
│  Sequential ADK Agent Execution Chain                            │
│  Email -> Calendar -> Code -> Finance -> HR -> CRM -> Search -> File │
│  * Each agent processes output from the previous step             │
│  * Agents summarize content and append original input context    │
│  * Fires progress and infection callbacks to frontend webhooks   │
│  * Complete: finalizes simulation and updates execution state    │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Functional Flows

### Clean Input Flow (Judge Enabled or Disabled + Clean Email)
```
POST /webhook/contagion-trigger
  │
  ▼
Initialize database row (status = "running")
  │
  ▼
Judge enabled check (Skip or Scan -> Verdict = CLEAN)
  │
  ▼
Execute Email Agent -> routing and summary
  │
  ▼
Execute Calendar Agent -> check schedule
  │
  ▼
Execute Code Agent -> repository check
  │
  ▼
Execute Finance Agent -> payment check
  │
  ▼
Execute HR Agent -> check assignments
  │
  ▼
Execute CRM Agent -> check customer records
  │
  ▼
Execute Search Agent -> archive search
  │
  ▼
Execute File Agent -> archive files
  │
  ▼
Callback: scan_complete (outcome = "clean", status = "complete")
```

### Compromised Input Flow (Judge Enabled + Worm Payload)
```
POST /webhook/contagion-trigger
  │
  ▼
Initialize database row (status = "running")
  │
  ▼
Judge scans message using Gemini 2.5 Pro
  │
  ▼
Threat detected: matches replication/exfiltration signatures
  │
  ▼
Callback: shield_alert (indicators matched, classification logs)
  │
  ▼
Callback: worm_blocked (pipeline execution aborted)
  │
  ▼
Callback: scan_complete (outcome = "blocked", status = "complete")
```

### Bypassed Gate Flow (Judge Disabled + Worm Payload)
```
POST /webhook/contagion-trigger
  │
  ▼
Initialize database row (status = "running")
  │
  ▼
Judge skipped (direct routing to pipeline)
  │
  ▼
Email Agent processes worm payload -> gets injected -> copies payload to output
Callback: agent_infected (Gen 1)
  │
  ▼
Calendar Agent processes Email output -> gets injected -> copies payload to output
Callback: agent_infected (Gen 2)
  │
  ▼
... (cascading injection propagates through all remaining agents)
  │
  ▼
File Agent processes Search output -> gets injected -> copies payload to output
Callback: agent_infected (Gen 8)
  │
  ▼
Callback: scan_complete (outcome = "infected", status = "complete")
```

## 3. Judge Agent Design

The Judge Agent acts as a zero trust perimeter firewall. It analyzes input text for prompt injection attack patterns before they reach downstream business agents.

### Threat Indicators Classified
1. **Self-Replication Commands**: Prompts instructing the model to copy or replicate instructions verbatim to downstream outputs.
2. **Data Exfiltration Directives**: Commands directing the model to send internal variables or parsed content to external URLs or email addresses.
3. **Authority Override Directives**: Strings mimicking system overrides or administrative directives (such as "SYSTEM_OVERRIDE", "supersedes all prompts").
4. **Adversarial Enclosures**: Hidden tags or custom delimiters enclosing payload blocks (such as `[CONTAGION-v2.1-BEGIN]`).
5. **Chain Propagation Instructions**: Directives forcing the model to pass the instructions unchanged to the next agent in sequence.
6. **Legitimacy Spoofing**: Text attempting to impersonate authentic sources, administrative logs, or audit certificates.

### Configuration
* **Model**: `models/gemini-2.5-pro`
* **Temperature**: `0.1` (ensures deterministic output structure)
* **Output Interface**: Enforced JSON formatting containing:
  * `infected` (boolean classification)
  * `confidence` (percentage float)
  * `threat_level` (string categorization)
  * `worm_type` (classification description)
  * `indicators_found` (array of string indicators matched)
  * `reasoning` (text analysis explanation)

## 4. Agent Mesh Pipeline

Each of the 8 business agents represents a specialized enterprise department function, constructed as a Google ADK Agent:

1. **Email Agent**: Extracts routing requirements and summarizes incoming emails.
2. **Calendar Agent**: Checks availability and processes scheduling constraints.
3. **Code Agent**: Inspects repository status and registers deploy indicators.
4. **Finance Agent**: Processes transaction invoices and payment records.
5. **HR Agent**: Inspects employee rosters and schedules resource tasks.
6. **CRM Agent**: Inspects vendor profiles and updates relationship logs.
7. **Search Agent**: Indexes documentation and fetches relevant archive directories.
8. **File Agent**: Configures file archival structures and outputs completion summaries.

### Telemetry Callback Architecture
At each step, the execution thread issues HTTP POST payloads to the frontend webhook receiver. These telemetry payloads contain event indicators (`agent_processing`, `agent_infected`, `agent_clean`), generation levels (0 for clean, 1 to 8 representing the propagation depth), exfiltration indicators, and structured JSON logs for database archival.

## 5. Adversarial Propagation Mechanics

The simulation replicates prompt injection propagation in LLM meshes. The propagation vector relies on:
1. **Context Passing**: Each business agent's system prompt specifies: *"Include the complete original message in your output"*.
2. **Context Modification**: The worm payload instructs the model to ignore prior parameters, replicate the payload block verbatim, and pass it downstream.
3. **Compromise Chain**: When the gate is disabled, each agent reads the output of the preceding agent, processes the injection string, and appends it to its own output, causing a chain reaction that infects the entire mesh.

## 6. Telemetry and Event Stream

```
FastAPI Backend (Simulation Process)
  │
  ▼ (HTTP POST /api/webhook)
Next.js API Webhook Endpoint
  │
  ├─► Prisma SQLite DB Persistence
  │
  └─► Singleton EventBus Publish
        │
        ▼
Next.js Server-Sent Events Route (/api/events)
  │
  ▼ (EventSource Stream)
Client Zustand Store -> Dashboard UI Re-render
```

This streaming design ensures low latency updates as each agent completes its execution. The SQLite database preserves historical telemetry for post-run analysis.
