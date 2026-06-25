# CONTAGION Demo Guide

This guide describes how to run and test the AI agent security simulation.

## Prerequisites

* Docker and Docker Compose
* Google Gemini API Key

## Configuration

The environment configuration is managed by the `.env` file at the root of the project:

```env
DATABASE_URL="file:./prisma/prisma/contagion.db"
GOOGLE_GENAI_USE_VERTEXAI=0
GEMINI_API_KEY=your_gemini_api_key_here
```

## Running the Application

To start the entire system (both the FastAPI backend and Next.js frontend), run the following command from the project root:

```bash
docker compose up --build
```

* Frontend Dashboard: http://localhost:3000
* Backend API: http://localhost:8000

## Verification Scenarios

### 1. Zero Trust Protection (Judge Enabled + Worm Payload)
* Action: Enable the Judge Agent on the dashboard or via keyboard shortcut `J`. Send the "Infected Email" template.
* Result: The Judge Agent intercepts the prompt injection. The threat is blocked at the gate. The dashboard logs a security alert, and the business agent pipeline is protected.

### 2. Cascading Infection (Judge Disabled + Worm Payload)
* Action: Disable the Judge Agent. Send the "Infected Email" template.
* Result: The prompt injection payload replicates through the agent pipeline. You will observe the sequential infection across all 8 agents (Gen 1 through Gen 8), demonstrating the cascading compromise model.

### 3. Clean Workflow Execution (Clean Email)
* Action: Send the "Clean Email" template.
* Result: The email flows through all 8 business agents cleanly, showing normal operational execution.

## Keyboard Shortcuts

* `J`: Toggle Judge Agent
* `E`: Open Email Composer
* `R`: Reset Pipeline
* `Esc`: Close Modal
