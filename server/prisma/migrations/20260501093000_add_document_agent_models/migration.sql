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
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProjectTask_projectId_idx" ON "ProjectTask"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectRiskFlag_projectId_idx" ON "ProjectRiskFlag"("projectId");
CREATE INDEX IF NOT EXISTS "DocumentProcessingRun_projectId_idx" ON "DocumentProcessingRun"("projectId");
CREATE INDEX IF NOT EXISTS "DocumentProcessingRun_documentId_idx" ON "DocumentProcessingRun"("documentId");
CREATE INDEX IF NOT EXISTS "DocumentChunk_projectId_idx" ON "DocumentChunk"("projectId");
CREATE INDEX IF NOT EXISTS "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");

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
