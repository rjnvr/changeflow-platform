import type {
  ProjectAccessRequest,
  ProjectAnalyticsBrief,
  Project,
  ProjectDocument,
  ProjectDocumentUploadIntent,
  ProjectTeamMember,
  ProjectTeamMemberDirectoryEntry
} from "../types/project";

import { apiRequest } from "./client";

export function getProjects(options?: { includeArchived?: boolean }) {
  const query = options?.includeArchived ? "?includeArchived=true" : "";
  return apiRequest<Project[]>(`/projects${query}`);
}

export function getLockedProjects(options?: { includeArchived?: boolean }) {
  const query = options?.includeArchived ? "?includeArchived=true" : "";
  return apiRequest<Project[]>(`/projects/locked${query}`);
}

export function createProject(input: {
  name: string;
  code: string;
  location: string;
  status: "active" | "on-hold" | "completed";
  contractValue: number;
  ownerId: string;
}) {
  return apiRequest<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateProject(
  projectId: string,
  input: {
    name: string;
    code: string;
    location: string;
    status: "active" | "on-hold" | "completed";
    contractValue: number;
  }
) {
  return apiRequest<Project>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function getProject(projectId: string) {
  return apiRequest<Project>(`/projects/${projectId}`);
}

export function generateProjectBrief(projectId: string) {
  return apiRequest<ProjectAnalyticsBrief>(`/projects/${projectId}/brief`, {
    method: "POST"
  });
}

export function requestProjectAccess(projectId: string, input?: { message?: string }) {
  return apiRequest<ProjectAccessRequest>(`/projects/${projectId}/access-requests`, {
    method: "POST",
    body: JSON.stringify(input ?? {})
  });
}

export function getProjectAccessRequests() {
  return apiRequest<ProjectAccessRequest[]>("/projects/access-requests");
}

export function approveProjectAccessRequest(requestId: string) {
  return apiRequest<ProjectAccessRequest>(`/projects/access-requests/${requestId}/approve`, {
    method: "POST"
  });
}

export function rejectProjectAccessRequest(requestId: string) {
  return apiRequest<ProjectAccessRequest>(`/projects/access-requests/${requestId}/reject`, {
    method: "POST"
  });
}

export function getProjectTeamMembers(projectId: string) {
  return apiRequest<ProjectTeamMember[]>(`/projects/${projectId}/team`);
}

export function getProjectTeamDirectory() {
  return apiRequest<ProjectTeamMemberDirectoryEntry[]>("/projects/team-members");
}

export function createProjectTeamMember(projectId: string, input: { name: string; role: string }) {
  return apiRequest<ProjectTeamMember>(`/projects/${projectId}/team`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateProjectTeamMember(
  projectId: string,
  teamMemberId: string,
  input: { name: string; role: string }
) {
  return apiRequest<ProjectTeamMember>(`/projects/${projectId}/team/${teamMemberId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function getProjectDocuments(projectId: string) {
  return apiRequest<ProjectDocument[]>(`/projects/${projectId}/documents`);
}

export function createProjectDocument(
  projectId: string,
  input: {
    title: string;
    kind: string;
    summary: string;
    assignedTo?: string;
    url?: string;
    storageKey?: string;
    fileName?: string;
    contentType?: string;
    fileSize?: number;
  }
) {
  return apiRequest<ProjectDocument>(`/projects/${projectId}/documents`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateProjectDocument(
  projectId: string,
  documentId: string,
  input: {
    title: string;
    kind: string;
    summary: string;
    assignedTo?: string;
    url?: string;
  }
) {
  return apiRequest<ProjectDocument>(`/projects/${projectId}/documents/${documentId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function createProjectDocumentUploadIntent(
  projectId: string,
  input: {
    fileName: string;
    contentType?: string;
    fileSize: number;
  }
) {
  return apiRequest<ProjectDocumentUploadIntent>(`/projects/${projectId}/documents/upload-intent`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getProjectDocumentDownloadUrl(projectId: string, documentId: string) {
  return apiRequest<{ url: string }>(`/projects/${projectId}/documents/${documentId}/download-url`);
}

export function bulkUpdateProjectStatus(input: {
  projectIds: string[];
  status: "active" | "on-hold" | "completed";
}) {
  return apiRequest<Project[]>("/projects/status", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function archiveProject(projectId: string) {
  return apiRequest<Project>(`/projects/${projectId}/archive`, {
    method: "POST"
  });
}

export function deleteProjectTeamMember(projectId: string, teamMemberId: string) {
  return apiRequest<ProjectTeamMember>(`/projects/${projectId}/team/${teamMemberId}`, {
    method: "DELETE"
  });
}

export function deleteProjectDocument(projectId: string, documentId: string) {
  return apiRequest<ProjectDocument>(`/projects/${projectId}/documents/${documentId}`, {
    method: "DELETE"
  });
}
