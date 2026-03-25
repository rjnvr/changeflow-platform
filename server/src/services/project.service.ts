import { projectRepository } from "../repositories/project.repository.js";
import { projectDocumentRepository } from "../repositories/projectDocument.repository.js";
import { projectTeamMemberRepository } from "../repositories/projectTeamMember.repository.js";
import type { AuthenticatedUser } from "../types/domain.js";
import { ApiError } from "../utils/apiError.js";
import { auditLogService } from "./auditLog.service.js";
import { storageService } from "./storage.service.js";

function canEditProject(user: AuthenticatedUser, ownerId: string) {
  return user.role === "admin" || user.id === ownerId;
}

export const projectService = {
  async listProjects(options?: { includeArchived?: boolean }) {
    return projectRepository.list(options);
  },
  async getProject(projectId: string) {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    return project;
  },
  async listTeamMembers(projectId: string) {
    await this.getProject(projectId);
    return projectTeamMemberRepository.listByProject(projectId);
  },
  async listTeamDirectory() {
    return projectTeamMemberRepository.listDirectory();
  },
  async addTeamMember(projectId: string, input: { name: string; role: string }) {
    const project = await this.getProject(projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    const member = await projectTeamMemberRepository.create({
      projectId,
      name: input.name,
      role: input.role
    });

    await auditLogService.record("project.team_member.created", "projectTeamMember", member.id, {
      projectId,
      name: member.name,
      role: member.role
    });

    return member;
  },
  async updateTeamMember(
    user: AuthenticatedUser,
    projectId: string,
    teamMemberId: string,
    input: { name: string; role: string }
  ) {
    const project = await this.getProject(projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can edit team members.");
    }

    const updatedMember = await projectTeamMemberRepository.update(projectId, teamMemberId, {
      name: input.name.trim(),
      role: input.role.trim()
    });

    if (!updatedMember) {
      throw new ApiError(404, "Team member not found.");
    }

    await auditLogService.record("project.team_member.updated", "projectTeamMember", updatedMember.id, {
      projectId,
      name: updatedMember.name,
      role: updatedMember.role
    });

    return updatedMember;
  },
  async removeTeamMember(user: AuthenticatedUser, projectId: string, teamMemberId: string) {
    const project = await this.getProject(projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can remove team members.");
    }

    const deletedMember = await projectTeamMemberRepository.delete(projectId, teamMemberId);

    if (!deletedMember) {
      throw new ApiError(404, "Team member not found.");
    }

    await auditLogService.record("project.team_member.deleted", "projectTeamMember", deletedMember.id, {
      projectId,
      name: deletedMember.name
    });

    return deletedMember;
  },
  async listDocuments(projectId: string) {
    await this.getProject(projectId);
    return projectDocumentRepository.listByProject(projectId);
  },
  async addDocument(
    projectId: string,
    input: {
      title: string;
      kind: string;
      summary: string;
      url?: string;
      storageKey?: string;
      fileName?: string;
      contentType?: string;
      fileSize?: number;
    }
  ) {
    const project = await this.getProject(projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    const document = await projectDocumentRepository.create({
      projectId,
      title: input.title,
      kind: input.kind,
      summary: input.summary,
      url: input.url?.trim() ? input.url.trim() : undefined,
      storageKey: input.storageKey,
      fileName: input.fileName,
      contentType: input.contentType,
      fileSize: input.fileSize
    });

    await auditLogService.record("project.document.created", "projectDocument", document.id, {
      projectId,
      title: document.title,
      kind: document.kind
    });

    return document;
  },
  async updateDocument(
    user: AuthenticatedUser,
    projectId: string,
    documentId: string,
    input: {
      title: string;
      kind: string;
      summary: string;
      url?: string;
    }
  ) {
    const project = await this.getProject(projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can edit documents.");
    }

    const updatedDocument = await projectDocumentRepository.update(projectId, documentId, {
      title: input.title.trim(),
      kind: input.kind.trim(),
      summary: input.summary.trim(),
      url: input.url?.trim() ? input.url.trim() : undefined
    });

    if (!updatedDocument) {
      throw new ApiError(404, "Document not found.");
    }

    await auditLogService.record("project.document.updated", "projectDocument", updatedDocument.id, {
      projectId,
      title: updatedDocument.title,
      kind: updatedDocument.kind
    });

    return updatedDocument;
  },
  async removeDocument(user: AuthenticatedUser, projectId: string, documentId: string) {
    const project = await this.getProject(projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can remove documents.");
    }

    const deletedDocument = await projectDocumentRepository.delete(projectId, documentId);

    if (!deletedDocument) {
      throw new ApiError(404, "Document not found.");
    }

    if (deletedDocument.storageKey) {
      await storageService.deleteObject(deletedDocument.storageKey);
    }

    await auditLogService.record("project.document.deleted", "projectDocument", deletedDocument.id, {
      projectId,
      title: deletedDocument.title
    });

    return deletedDocument;
  },
  async createDocumentUploadIntent(
    projectId: string,
    input: {
      fileName: string;
      contentType?: string;
      fileSize: number;
    }
  ) {
    const project = await this.getProject(projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    return storageService.createProjectDocumentUploadIntent({
      projectId,
      fileName: input.fileName,
      contentType: input.contentType,
      fileSize: input.fileSize
    });
  },
  async getDocumentDownloadUrl(projectId: string, documentId: string) {
    await this.getProject(projectId);

    const document = await projectDocumentRepository.findById(projectId, documentId);

    if (!document) {
      throw new ApiError(404, "Document not found.");
    }

    if (document.url) {
      return {
        url: document.url
      };
    }

    if (!document.storageKey) {
      throw new ApiError(400, "This document does not have a file attached.");
    }

    return {
      url: await storageService.createDownloadUrl({
        storageKey: document.storageKey,
        fileName: document.fileName ?? document.title,
        contentType: document.contentType
      })
    };
  },
  async bulkUpdateProjectStatus(input: {
    projectIds: string[];
    status: "active" | "on-hold" | "completed";
  }) {
    const uniqueProjectIds = [...new Set(input.projectIds.filter(Boolean))];

    if (uniqueProjectIds.length === 0) {
      throw new ApiError(400, "Select at least one project.");
    }

    const updatedProjects = await projectRepository.bulkUpdateStatus(uniqueProjectIds, input.status);

    await Promise.all(
      updatedProjects.map((project) =>
        auditLogService.record("project.status_bulk_updated", "project", project.id, {
          status: project.status
        })
      )
    );

    return updatedProjects;
  },
  async createProject(input: {
    name: string;
    code: string;
    location: string;
    status: "active" | "on-hold" | "completed";
    contractValue: number;
    ownerId: string;
  }) {
    const normalizedCode = input.code.trim().toUpperCase();
    const existingProject = await projectRepository.findByCode(normalizedCode);

    if (existingProject) {
      throw new ApiError(409, "A project with that code already exists.");
    }

    const project = await projectRepository.create({
      ...input,
      name: input.name.trim(),
      code: normalizedCode,
      location: input.location.trim()
    });

    await auditLogService.record("project.created", "project", project.id, {
      projectCode: project.code
    });

    return project;
  },
  async updateProject(
    user: AuthenticatedUser,
    projectId: string,
    input: {
      name: string;
      code: string;
      location: string;
      status: "active" | "on-hold" | "completed";
      contractValue: number;
    }
  ) {
    const project = await this.getProject(projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can edit this project.");
    }

    const normalizedCode = input.code.trim().toUpperCase();
    const existingProject = await projectRepository.findByCode(normalizedCode);

    if (existingProject && existingProject.id !== projectId) {
      throw new ApiError(409, "A project with that code already exists.");
    }

    const updatedProject = await projectRepository.update(projectId, {
      name: input.name.trim(),
      code: normalizedCode,
      location: input.location.trim(),
      status: input.status,
      contractValue: input.contractValue
    });

    await auditLogService.record("project.updated", "project", updatedProject.id, {
      projectCode: updatedProject.code,
      status: updatedProject.status
    });

    return updatedProject;
  },
  async archiveProject(user: AuthenticatedUser, projectId: string) {
    const project = await this.getProject(projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Project is already archived.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can archive this project.");
    }

    const archivedProject = await projectRepository.archive(projectId);

    await auditLogService.record("project.archived", "project", archivedProject.id, {
      projectCode: archivedProject.code
    });

    return archivedProject;
  }
};
