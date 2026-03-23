export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "admin" | "project_manager" | "accounting";
}

export interface ProjectRecord {
  id: string;
  name: string;
  code: string;
  location: string;
  status: "active" | "on-hold" | "completed";
  contractValue: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrderRecord {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "synced";
  amount: number;
  requestedBy: string;
  externalReference?: string;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConnectionRecord {
  id: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  lastSyncedAt?: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

