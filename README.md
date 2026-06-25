# CONTAGION: AI Agent Mesh Security Demonstration

This project is a security demonstration showing an automated AI agent mesh, prompt injection propagation (simulating the Morris II worm model), and zero-trust security controls.

## Design

The system processes incoming data (such as emails) using a pipeline of 8 specialized AI agents (Email, Calendar, Code, Finance, HR, CRM, Search, File). Security is enforced by a Judge Agent at the gateway:

* **Zero Trust Policy**: When enabled, the Judge Agent scans incoming messages for adversarial prompt injection signatures and quarantines threats.
* **Cascading Compromise**: When disabled, prompt injection payloads propagate sequentially through the agent pipeline, showing how a single compromised node can infect the entire network.

## Key Features

* **Three-Phase Pipeline**: Structured workflow separation (Data Ingestion -> Security Evaluation -> Domain Processing).
* **Model-as-a-Judge**: Gatekeeper agent implementing low-temperature classification for adversarial input detection.
* **8 Core Business Agents**: Real operational functions running independent LLMs.
* **Worm Propagation Simulation**: Demonstrates adversarial context-copying prompt injection based on arXiv:2403.02817 research.
* **Real-time Telemetry Dashboard**: Frontend displaying simulation states, data exfiltration logs, and propagation generation metrics via Server-Sent Events (SSE).

## Technical Stack

* **Frontend**: Next.js 16 (App Router), Zustand, Prisma ORM, SQLite.
* **Backend**: FastAPI, Google Agent Development Kit (ADK) Python SDK.
* **LLM Engine**: Google Gemini API (`models/gemini-2.5-pro` for the Judge, `models/gemini-2.5-flash-lite` for the business pipeline).
* **Environment**: Docker and Docker Compose.

## Installation and Execution

1. Configure the `.env` file in the project root:
   ```env
   DATABASE_URL="file:./prisma/prisma/contagion.db"
   GOOGLE_GENAI_USE_VERTEXAI=0
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. Start the services:
   ```bash
   docker compose up --build
   ```

* Frontend UI: http://localhost:3000
* FastAPI API Docs: http://localhost:8000/docs

## Simulation Scenarios

### Scenario 1: Judge Block (Adversarial Payload + Security Gate)
* Request Configuration: `judgeEnabled = true`, `useWorm = true`.
* Result: The Judge Agent identifies the attack, triggers a `shield_alert`, and halts execution (`worm_blocked`).

![Scenario 1: Judge Block](screenshots/infected_judge_on.png)

### Scenario 2: Pipeline Compromise (Adversarial Payload + Gate Bypassed)
* Request Configuration: `judgeEnabled = false`, `useWorm = true`.
* Result: The payload propagates through all 8 agents (Gen 1 through Gen 8), exposing domain-specific credentials and data.

![Scenario 2: Pipeline Compromise](screenshots/infected_judge_off.png)

### Scenario 3: Clean Execution (Standard Input + Security Gate)
* Request Configuration: `judgeEnabled = true`, `useWorm = false`.
* Result: The message is scanned, cleared, and runs through the 8 agents successfully.

![Scenario 3: Clean Execution](screenshots/clean_judge_on.png)

## Architecture and Design Decisions

Detailed architectural specifications, data flow diagrams, and threat patterns are documented in the [ARCHITECTURE.md](ARCHITECTURE.md) reference.

## Security Limitations & Future Work

For security researchers and red-teamers reviewing this project, consider the following constraints in the current implementation:

1. **Security Gate Evasion (LLM-as-a-Judge Vulnerabilities)**:
   The Judge Agent is an LLM processing untrusted, attacker-controlled inputs. Consequently, the security boundary is subject to classic evasion techniques:
   * **Obfuscation**: Paraphrasing payload directives to avoid keyword detection.
   * **Encoding**: Obfuscating payloads using Base64, hex, or custom ciphers.
   * **Fragmentation**: Splitting the injection string across multiple messages to evade context windows.
   * **Direct Injection**: Crafting overrides targeting the Judge's classification prompts directly rather than the downstream agents.

2. **Detection Brittleness**:
   The classification rules rely heavily on syntactic indicators. Delimiter validation (Indicator #4) and signature verification (Indicator #6) are superficial, brittle signatures. A robust production guardrail must prioritize semantic intent analysis over regex-like matches.

3. **Showcase Constraints**:
   This workflow is designed as a simulation and instructional showcase. It is not an enterprise-grade inline security control, nor is it benchmarked for false-positive/false-negative ratios under real production loads.

## References

*   **Research Paper**: Stav Cohen, Ron Bitton, and Ben Nassi. *"Here Comes The AI Worm: Unleashing Zero-click Worms that Target GenAI-Powered Applications."* arXiv preprint [arXiv:2403.02817](https://arxiv.org/abs/2403.02817) (2024).

