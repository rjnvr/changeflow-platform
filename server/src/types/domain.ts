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
  aiSummary?: string;
  agentStatus: string;
  processingError?: string;
  lastProcessedAt?: string;
  assignedTo?: string;
  url?: string;
  storageKey?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTaskRecord {
  id: string;
  projectId: string;
  projectName?: string;
  sourceDocumentId?: string;
  title: string;
  description: string;
  status: string;
  assignedTo?: string;
  createdByAgent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRiskFlagRecord {
  id: string;
  projectId: string;
  projectName?: string;
  sourceDocumentId?: string;
  level: string;
  title: string;
  description: string;
  status: string;
  createdByAgent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCommentRecord {
  id: string;
  projectId: string;
  sourceDocumentId?: string;
  authorName: string;
  body: string;
  createdByAgent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentProcessingRunRecord {
  id: string;
  projectId: string;
  documentId: string;
  status: string;
  extractionMethod: string;
  extractedTextChars?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStepRecord {
  id: string;
  runId: string;
  stepType: string;
  status: string;
  title: string;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentToolExecutionRecord {
  id: string;
  runId: string;
  toolName: string;
  status: string;
  title: string;
  resultSummary?: string;
  inputJson?: string;
  outputJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRunRecord {
  id: string;
  projectId: string;
  documentId?: string;
  trigger: string;
  status: string;
  summary?: string;
  model?: string;
  steps: AgentStepRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentMemoryEntryRecord {
  id: string;
  projectId: string;
  documentId?: string;
  runId?: string;
  kind: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunkRecord {
  id: string;
  projectId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  embeddingModel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAgentWorkspaceRecord {
  tasks: ProjectTaskRecord[];
  riskFlags: ProjectRiskFlagRecord[];
  comments: ProjectCommentRecord[];
  processingRuns: DocumentProcessingRunRecord[];
  agentRuns: AgentRunRecord[];
  toolExecutions: AgentToolExecutionRecord[];
  memoryEntries: AgentMemoryEntryRecord[];
}

export interface ProjectQuestionAnswerRecord {
  answer: string;
  citations: Array<{
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    excerpt: string;
  }>;
  source: "claude" | "fallback";
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
