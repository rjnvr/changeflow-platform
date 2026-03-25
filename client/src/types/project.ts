export interface Project {
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
