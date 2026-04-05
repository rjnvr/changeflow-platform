export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "admin" | "project_manager" | "accounting";
}

export interface ProjectAnalyticsQuotaRecord {
  userLimit: number;
  userUsed: number;
  userRemaining: number;
  dayStart: string;
  dayEnd: string;
  globalLimit: number;
  globalUsed: number;
  globalRemaining: number;
  monthStart: string;
  monthEnd: string;
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
  accessSource?: "admin" | "owner" | "team_assignment" | "granted";
  accessLocked?: boolean;
  accessRequestStatus?: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAccessRequestRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  projectLocation: string;
  status: "pending" | "approved" | "rejected";
  message?: string;
  handledById?: string;
  handledAt?: string;
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
  assignedTo?: string;
  url?: string;
  storageKey?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAnalyticsBriefRecord {
  summary: string;
  currentState: string[];
  recentProgress: string[];
  nextSteps: string[];
  watchouts: string[];
  usage: ProjectAnalyticsQuotaRecord;
  source: "claude" | "fallback";
  generatedAt: string;
}

export interface UserBriefQuotaRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "project_manager" | "accounting";
  dailyProjectBriefLimit: number;
  usedToday: number;
  remainingToday: number;
}

export interface BriefQuotaDashboardRecord {
  globalLimit: number;
  globalUsed: number;
  globalRemaining: number;
  monthStart: string;
  monthEnd: string;
  users: UserBriefQuotaRecord[];
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
