CREATE TABLE IF NOT EXISTS "ProjectAccess" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "grantedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectAccess_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProjectAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectAccess_userId_projectId_key" ON "ProjectAccess" ("userId", "projectId");
CREATE INDEX IF NOT EXISTS "ProjectAccess_userId_idx" ON "ProjectAccess" ("userId");
CREATE INDEX IF NOT EXISTS "ProjectAccess_projectId_idx" ON "ProjectAccess" ("projectId");

CREATE TABLE IF NOT EXISTS "ProjectAccessRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "message" TEXT,
  "handledById" TEXT,
  "handledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectAccessRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProjectAccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectAccessRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectAccessRequest_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProjectAccessRequest_userId_idx" ON "ProjectAccessRequest" ("userId");
CREATE INDEX IF NOT EXISTS "ProjectAccessRequest_projectId_idx" ON "ProjectAccessRequest" ("projectId");
CREATE INDEX IF NOT EXISTS "ProjectAccessRequest_status_idx" ON "ProjectAccessRequest" ("status");
