export interface Project {
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

export interface ProjectAccessRequest {
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

export interface ProjectTeamMember {
  id: string;
  projectId: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTeamMemberDirectoryEntry extends ProjectTeamMember {
  projectName: string;
  projectCode: string;
  projectLocation: string;
}

export interface ProjectDocument {
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

export interface ProjectDocumentUploadIntent {
  uploadUrl: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  expiresIn: number;
}

export interface ProjectAnalyticsUsage {
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

export interface ProjectAnalyticsBrief {
  summary: string;
  currentState: string[];
  recentProgress: string[];
  nextSteps: string[];
  watchouts: string[];
  usage: ProjectAnalyticsUsage;
  source: "claude" | "fallback";
  generatedAt: string;
}

export type ProjectTaskStatus = "suggested" | "open" | "in_progress" | "done";
export type ProjectRiskFlagStatus = "open" | "reviewed" | "mitigated";

export interface ProjectTask {
  id: string;
  projectId: string;
  projectName?: string;
  sourceDocumentId?: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  assignedTo?: string;
  createdByAgent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRiskFlag {
  id: string;
  projectId: string;
  projectName?: string;
  sourceDocumentId?: string;
  level: string;
  title: string;
  description: string;
  status: ProjectRiskFlagStatus;
  createdByAgent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  sourceDocumentId?: string;
  authorName: string;
  body: string;
  createdByAgent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentProcessingRun {
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

export interface AgentStep {
  id: string;
  runId: string;
  stepType: string;
  status: string;
  title: string;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentToolExecution {
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

export interface AgentPendingAction {
  id: string;
  runId: string;
  projectId: string;
  documentId?: string;
  actionType: "assign_document" | "add_project_comment" | "suggest_change_order_follow_up";
  status: "pending" | "approved" | "dismissed";
  title: string;
  summary: string;
  inputJson?: string;
  approvedById?: string;
  approvedAt?: string;
  dismissedById?: string;
  dismissedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRun {
  id: string;
  projectId: string;
  documentId?: string;
  trigger: string;
  status: string;
  summary?: string;
  model?: string;
  steps: AgentStep[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentMemoryEntry {
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

export interface ProjectAgentWorkspace {
  tasks: ProjectTask[];
  riskFlags: ProjectRiskFlag[];
  comments: ProjectComment[];
  processingRuns: DocumentProcessingRun[];
  agentRuns: AgentRun[];
  toolExecutions: AgentToolExecution[];
  pendingActions: AgentPendingAction[];
  memoryEntries: AgentMemoryEntry[];
}

export interface ProjectQuestionAnswer {
  answer: string;
  citations: Array<{
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    excerpt: string;
  }>;
  source: "claude" | "fallback";
}
