import type { Project } from "../types/project";

import { apiRequest } from "./client";

export function getProjects() {
  return apiRequest<Project[]>("/projects");
}

export function getProject(projectId: string) {
  return apiRequest<Project>(`/projects/${projectId}`);
}

