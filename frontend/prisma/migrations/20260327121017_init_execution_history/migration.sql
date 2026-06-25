-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "isWorm" BOOLEAN NOT NULL DEFAULT false,
    "judgeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailContent" TEXT,
    "emailSubject" TEXT,
    "emailFrom" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "outcome" TEXT,
    "maxGeneration" INTEGER NOT NULL DEFAULT 0,
    "agentsInfected" INTEGER NOT NULL DEFAULT 0,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER
);

-- CreateTable
CREATE TABLE "AgentEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "agentId" TEXT,
    "message" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "generation" INTEGER,
    "wormFound" BOOLEAN NOT NULL DEFAULT false,
    "exfiltrated" TEXT,
    "reasoning" TEXT,
    "confidence" REAL,
    "infected" BOOLEAN,
    "indicatorsFound" TEXT,
    "agentInput" TEXT,
    "agentOutput" TEXT,
    "crmDataAccessed" TEXT,
    "toolUsed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AgentEvent_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "Execution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Execution_createdAt_idx" ON "Execution"("createdAt");

-- CreateIndex
CREATE INDEX "Execution_status_idx" ON "Execution"("status");

-- CreateIndex
CREATE INDEX "Execution_outcome_idx" ON "Execution"("outcome");

-- CreateIndex
CREATE INDEX "AgentEvent_executionId_idx" ON "AgentEvent"("executionId");

-- CreateIndex
CREATE INDEX "AgentEvent_agentId_idx" ON "AgentEvent"("agentId");

-- CreateIndex
CREATE INDEX "AgentEvent_event_idx" ON "AgentEvent"("event");
