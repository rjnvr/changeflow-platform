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
  archivedAt?: string;
  contractValue: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTeamMemberRecord {
  id: string;
  projectId: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTeamMemberDirectoryRecord extends ProjectTeamMemberRecord {
  projectName: string;
  projectCode: string;
  projectLocation: string;
}

export interface ProjectDocumentRecord {
  id: string;
  projectId: string;
  title: string;
  kind: string;
  summary: string;
  url?: string;
  storageKey?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrderRecord {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "synced";
  archivedAt?: string;
  amount: number;
  requestedBy: string;
  assignedTo?: string;
  externalReference?: string;
  aiSummary?: string;
  attachments: ChangeOrderAttachmentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrderAttachmentRecord {
  id: string;
  changeOrderId: string;
  title: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrderCommentRecord {
  id: string;
  changeOrderId: string;
  authorName: string;
  body: string;
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
