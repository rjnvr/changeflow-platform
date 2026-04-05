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
