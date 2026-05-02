ALTER TABLE "ProjectDocument"
ADD COLUMN IF NOT EXISTS "aiSummary" TEXT,
ADD COLUMN IF NOT EXISTS "agentStatus" TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS "processingError" TEXT,
ADD COLUMN IF NOT EXISTS "lastProcessedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "ProjectTask" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceDocumentId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "assignedTo" TEXT,
  "createdByAgent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjectRiskFlag" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceDocumentId" TEXT,
  "level" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdByAgent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectRiskFlag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjectComment" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceDocumentId" TEXT,
  "authorName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdByAgent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentProcessingRun" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "extractionMethod" TEXT NOT NULL,
  "extractedTextChars" INTEGER,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentProcessingRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentChunk" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "embeddingJson" TEXT,
  "embeddingModel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentRun" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentId" TEXT,
  "trigger" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'running',
  "summary" TEXT,
  "model" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentStep" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "stepType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "title" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentToolExecution" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "title" TEXT NOT NULL,
  "resultSummary" TEXT,
  "inputJson" TEXT,
  "outputJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentToolExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AgentMemoryEntry" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentId" TEXT,
  "runId" TEXT,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentMemoryEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DocumentChunk"
ADD COLUMN IF NOT EXISTS "embeddingJson" TEXT,
ADD COLUMN IF NOT EXISTS "embeddingModel" TEXT;

CREATE INDEX IF NOT EXISTS "ProjectTask_projectId_idx" ON "ProjectTask"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectRiskFlag_projectId_idx" ON "ProjectRiskFlag"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectComment_projectId_idx" ON "ProjectComment"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectComment_sourceDocumentId_idx" ON "ProjectComment"("sourceDocumentId");
CREATE INDEX IF NOT EXISTS "DocumentProcessingRun_projectId_idx" ON "DocumentProcessingRun"("projectId");
CREATE INDEX IF NOT EXISTS "DocumentProcessingRun_documentId_idx" ON "DocumentProcessingRun"("documentId");
CREATE INDEX IF NOT EXISTS "DocumentChunk_projectId_idx" ON "DocumentChunk"("projectId");
CREATE INDEX IF NOT EXISTS "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");
CREATE INDEX IF NOT EXISTS "AgentRun_projectId_idx" ON "AgentRun"("projectId");
CREATE INDEX IF NOT EXISTS "AgentRun_documentId_idx" ON "AgentRun"("documentId");
CREATE INDEX IF NOT EXISTS "AgentStep_runId_idx" ON "AgentStep"("runId");
CREATE INDEX IF NOT EXISTS "AgentToolExecution_runId_idx" ON "AgentToolExecution"("runId");
CREATE INDEX IF NOT EXISTS "AgentMemoryEntry_projectId_idx" ON "AgentMemoryEntry"("projectId");
CREATE INDEX IF NOT EXISTS "AgentMemoryEntry_documentId_idx" ON "AgentMemoryEntry"("documentId");
CREATE INDEX IF NOT EXISTS "AgentMemoryEntry_runId_idx" ON "AgentMemoryEntry"("runId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectTask_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectTask"
      ADD CONSTRAINT "ProjectTask_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentRun_projectId_fkey'
  ) THEN
    ALTER TABLE "AgentRun"
      ADD CONSTRAINT "AgentRun_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentRun_documentId_fkey'
  ) THEN
    ALTER TABLE "AgentRun"
      ADD CONSTRAINT "AgentRun_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "ProjectDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentStep_runId_fkey'
  ) THEN
    ALTER TABLE "AgentStep"
      ADD CONSTRAINT "AgentStep_runId_fkey"
      FOREIGN KEY ("runId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentToolExecution_runId_fkey'
  ) THEN
    ALTER TABLE "AgentToolExecution"
      ADD CONSTRAINT "AgentToolExecution_runId_fkey"
      FOREIGN KEY ("runId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentMemoryEntry_projectId_fkey'
  ) THEN
    ALTER TABLE "AgentMemoryEntry"
      ADD CONSTRAINT "AgentMemoryEntry_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentMemoryEntry_documentId_fkey'
  ) THEN
    ALTER TABLE "AgentMemoryEntry"
      ADD CONSTRAINT "AgentMemoryEntry_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "ProjectDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AgentMemoryEntry_runId_fkey'
  ) THEN
    ALTER TABLE "AgentMemoryEntry"
      ADD CONSTRAINT "AgentMemoryEntry_runId_fkey"
      FOREIGN KEY ("runId") REFERENCES "AgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectComment_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectComment"
      ADD CONSTRAINT "ProjectComment_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectComment_sourceDocumentId_fkey'
  ) THEN
    ALTER TABLE "ProjectComment"
      ADD CONSTRAINT "ProjectComment_sourceDocumentId_fkey"
      FOREIGN KEY ("sourceDocumentId") REFERENCES "ProjectDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentChunk_projectId_fkey'
  ) THEN
    ALTER TABLE "DocumentChunk"
      ADD CONSTRAINT "DocumentChunk_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentChunk_documentId_fkey'
  ) THEN
    ALTER TABLE "DocumentChunk"
      ADD CONSTRAINT "DocumentChunk_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "ProjectDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectTask_sourceDocumentId_fkey'
  ) THEN
    ALTER TABLE "ProjectTask"
      ADD CONSTRAINT "ProjectTask_sourceDocumentId_fkey"
      FOREIGN KEY ("sourceDocumentId") REFERENCES "ProjectDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectRiskFlag_projectId_fkey'
  ) THEN
    ALTER TABLE "ProjectRiskFlag"
      ADD CONSTRAINT "ProjectRiskFlag_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProjectRiskFlag_sourceDocumentId_fkey'
  ) THEN
    ALTER TABLE "ProjectRiskFlag"
      ADD CONSTRAINT "ProjectRiskFlag_sourceDocumentId_fkey"
      FOREIGN KEY ("sourceDocumentId") REFERENCES "ProjectDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentProcessingRun_projectId_fkey'
  ) THEN
    ALTER TABLE "DocumentProcessingRun"
      ADD CONSTRAINT "DocumentProcessingRun_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentProcessingRun_documentId_fkey'
  ) THEN
    ALTER TABLE "DocumentProcessingRun"
      ADD CONSTRAINT "DocumentProcessingRun_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "ProjectDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
