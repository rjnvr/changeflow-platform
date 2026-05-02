import { projectCommentRepository } from "../repositories/projectComment.repository.js";
import { projectDocumentRepository } from "../repositories/projectDocument.repository.js";
import { projectRiskFlagRepository } from "../repositories/projectRiskFlag.repository.js";
import { projectTaskRepository } from "../repositories/projectTask.repository.js";
import type { ProjectCommentRecord, ProjectDocumentRecord, ProjectRiskFlagRecord, ProjectTaskRecord } from "../types/domain.js";

export const agentToolsService = {
  async createProjectTask(input: Omit<ProjectTaskRecord, "id" | "createdAt" | "updatedAt" | "projectName">) {
    return projectTaskRepository.create({
      ...input,
      relatedDocuments: input.relatedDocuments ?? []
    });
  },
  async createRiskFlag(input: Omit<ProjectRiskFlagRecord, "id" | "createdAt" | "updatedAt" | "projectName">) {
    return projectRiskFlagRepository.create(input);
  },
  async addProjectComment(input: Omit<ProjectCommentRecord, "id" | "createdAt" | "updatedAt">) {
    return projectCommentRepository.create(input);
  },
  async assignDocument(document: ProjectDocumentRecord, assignedTo?: string) {
    return projectDocumentRepository.update(document.projectId, document.id, {
      title: document.title,
      kind: document.kind,
      summary: document.summary,
      aiSummary: document.aiSummary,
      agentStatus: document.agentStatus,
      processingError: document.processingError,
      lastProcessedAt: document.lastProcessedAt,
      assignedTo,
      url: document.url
    });
  },
  async suggestChangeOrderFollowUp(input: {
    projectId: string;
    sourceDocumentId?: string;
    authorName: string;
    message: string;
  }) {
    return projectCommentRepository.create({
      projectId: input.projectId,
      sourceDocumentId: input.sourceDocumentId,
      authorName: input.authorName,
      body: input.message,
      createdByAgent: true
    });
  }
};
