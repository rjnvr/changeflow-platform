import { projectRepository } from "../repositories/project.repository.js";
import { ApiError } from "../utils/apiError.js";
import { auditLogService } from "./auditLog.service.js";

export const projectService = {
  listProjects() {
    return projectRepository.list();
  },
  getProject(projectId: string) {
    const project = projectRepository.findById(projectId);

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    return project;
  },
  createProject(input: {
    name: string;
    code: string;
    location: string;
    status: "active" | "on-hold" | "completed";
    contractValue: number;
    ownerId: string;
  }) {
    const project = projectRepository.create(input);

    auditLogService.record("project.created", "project", project.id, {
      projectCode: project.code
    });

    return project;
  }
};

