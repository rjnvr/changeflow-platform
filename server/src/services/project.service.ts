import { projectRepository } from "../repositories/project.repository.js";
import { projectDocumentRepository } from "../repositories/projectDocument.repository.js";
import { projectTeamMemberRepository } from "../repositories/projectTeamMember.repository.js";
import type {
  AgentMemoryEntryRecord,
  AgentPendingActionRecord,
  AgentRunRecord,
  AgentToolExecutionRecord,
  AuthenticatedUser
} from "../types/domain.js";
import { ApiError } from "../utils/apiError.js";
import { changeOrderRepository } from "../repositories/changeOrder.repository.js";
import { projectAccessRepository } from "../repositories/projectAccess.repository.js";
import { projectAccessRequestRepository } from "../repositories/projectAccessRequest.repository.js";
import { projectBriefGenerationRepository } from "../repositories/projectBriefGeneration.repository.js";
import { projectRiskFlagRepository } from "../repositories/projectRiskFlag.repository.js";
import { projectTaskRepository } from "../repositories/projectTask.repository.js";
import { projectCommentRepository } from "../repositories/projectComment.repository.js";
import { documentProcessingRunRepository } from "../repositories/documentProcessingRun.repository.js";
import { agentMemoryEntryRepository } from "../repositories/agentMemoryEntry.repository.js";
import { agentPendingActionRepository } from "../repositories/agentPendingAction.repository.js";
import { agentRunRepository } from "../repositories/agentRun.repository.js";
import { agentToolExecutionRepository } from "../repositories/agentToolExecution.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { auditLogService } from "./auditLog.service.js";
import { projectAccessService } from "./projectAccess.service.js";
import { aiSummaryService } from "./aiSummary.service.js";
import { agentToolsService } from "./agentTools.service.js";
import { documentAgentService } from "./documentAgent.service.js";
import { ragService } from "./rag.service.js";
import { storageService } from "./storage.service.js";

function isAgentHistoryStorageError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("P2021") ||
    error.message.includes("does not exist") ||
    error.message.includes("AgentRun") ||
    error.message.includes("AgentStep") ||
    error.message.includes("AgentMemoryEntry") ||
    error.message.includes("AgentToolExecution") ||
    error.message.includes("AgentPendingAction")
  );
}

function canEditProject(user: AuthenticatedUser, ownerId: string) {
  return user.role === "admin" || user.id === ownerId;
}

const GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT = 150;

function getMonthlyWindow(referenceDate = new Date()) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);

  return { monthStart, monthEnd };
}

function getDailyWindow(referenceDate = new Date()) {
  const dayStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const dayEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + 1);

  return { dayStart, dayEnd };
}

function autoAssignDocumentToTeamMember(
  input: {
    title: string;
    kind: string;
    summary: string;
    assignedTo?: string;
  },
  teamMembers: Array<{ name: string; role: string }>
) {
  const manualAssignment = input.assignedTo?.trim();

  if (manualAssignment) {
    return manualAssignment;
  }

  if (teamMembers.length === 0) {
    return undefined;
  }

  const normalizedContent = `${input.title} ${input.kind} ${input.summary}`.toLowerCase();
  const rules = [
    {
      contentKeywords: ["drawing", "layout", "spec", "architect", "plan", "dwg"],
      roleKeywords: ["architect", "architecture", "design", "engineer"]
    },
    {
      contentKeywords: ["quote", "budget", "invoice", "pricing", "cost", "commercial"],
      roleKeywords: ["commercial", "account", "finance", "executive", "cost"]
    },
    {
      contentKeywords: ["report", "photo", "inspection", "progress", "field", "daily"],
      roleKeywords: ["superintendent", "site", "foreman", "lead", "field", "super"]
    }
  ];

  for (const rule of rules) {
    if (!rule.contentKeywords.some((keyword) => normalizedContent.includes(keyword))) {
      continue;
    }

    const matchedTeamMember = teamMembers.find((teamMember) =>
      rule.roleKeywords.some((keyword) => teamMember.role.toLowerCase().includes(keyword))
    );

    if (matchedTeamMember) {
      return matchedTeamMember.name;
    }
  }

  return teamMembers[0]?.name;
}

export const projectService = {
  async listProjects(requestUser: AuthenticatedUser, options?: { includeArchived?: boolean }) {
    const { accessibleProjects } = await projectAccessService.listProjectAccessState(requestUser, options);
    return accessibleProjects;
  },
  async listLockedProjects(requestUser: AuthenticatedUser, options?: { includeArchived?: boolean }) {
    const { lockedProjects } = await projectAccessService.listProjectAccessState(requestUser, options);
    return lockedProjects;
  },
  async getProject(requestUser: AuthenticatedUser, projectId: string) {
    return projectAccessService.requireProjectAccess(requestUser, projectId);
  },
  async listTeamMembers(requestUser: AuthenticatedUser, projectId: string) {
    await this.getProject(requestUser, projectId);
    return projectTeamMemberRepository.listByProject(projectId);
  },
  async listTeamDirectory(requestUser: AuthenticatedUser) {
    const entries = await projectTeamMemberRepository.listDirectory();

    if (requestUser.role === "admin") {
      return entries;
    }

    const accessibleProjectIds = await projectAccessService.listAccessibleProjectIds(requestUser, {
      includeArchived: true
    });

    return entries.filter((entry) => accessibleProjectIds.includes(entry.projectId));
  },
  async generateProjectBrief(projectId: string, requestUser: AuthenticatedUser) {
    const project = await this.getProject(requestUser, projectId);
    const user = await userRepository.findById(requestUser.id);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const { monthStart, monthEnd } = getMonthlyWindow();
    const { dayStart, dayEnd } = getDailyWindow();
    const [globalUsed, userUsed, changeOrders, teamMembers, documents] = await Promise.all([
      projectBriefGenerationRepository.countForMonth(monthStart, monthEnd),
      projectBriefGenerationRepository.countForUserDay(user.id, dayStart, dayEnd),
      changeOrderRepository.list(projectId, { includeArchived: true }),
      projectTeamMemberRepository.listByProject(projectId),
      projectDocumentRepository.listByProject(projectId)
    ]);

    if (globalUsed >= GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT) {
      throw new ApiError(429, "The workspace has reached its monthly project brief limit of 150 generations.");
    }

    if (userUsed >= user.dailyProjectBriefLimit) {
      throw new ApiError(429, `You have reached your daily project brief limit of ${user.dailyProjectBriefLimit}.`);
    }

    const brief = await aiSummaryService.generateProjectBrief({
      project,
      changeOrders,
      teamMembers,
      documents,
      usage: {
        userLimit: user.dailyProjectBriefLimit,
        userUsed: userUsed + 1,
        userRemaining: Math.max(0, user.dailyProjectBriefLimit - (userUsed + 1)),
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString(),
        globalLimit: GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT,
        globalUsed: globalUsed + 1,
        globalRemaining: Math.max(0, GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT - (globalUsed + 1)),
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString()
      }
    });

    await projectBriefGenerationRepository.create({
      userId: user.id,
      projectId
    });

    return brief;
  },
  async addTeamMember(user: AuthenticatedUser, projectId: string, input: { name: string; role: string }) {
    const project = await this.getProject(user, projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can add team members.");
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
    const project = await this.getProject(user, projectId);

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
    const project = await this.getProject(user, projectId);

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
  async listDocuments(requestUser: AuthenticatedUser, projectId: string) {
    await this.getProject(requestUser, projectId);
    return projectDocumentRepository.listByProject(projectId);
  },
  async listComments(requestUser: AuthenticatedUser, projectId: string) {
    await this.getProject(requestUser, projectId);
    return projectCommentRepository.listByProject(projectId);
  },
  async getAgentWorkspace(requestUser: AuthenticatedUser, projectId: string) {
    await this.getProject(requestUser, projectId);

    const [tasks, riskFlags, comments, processingRuns] = await Promise.all([
      projectTaskRepository.listByProject(projectId),
      projectRiskFlagRepository.listByProject(projectId),
      projectCommentRepository.listByProject(projectId),
      documentProcessingRunRepository.listByProject(projectId)
    ]);

    let agentRuns: AgentRunRecord[] = [];
    let memoryEntries: AgentMemoryEntryRecord[] = [];
    let toolExecutions: AgentToolExecutionRecord[] = [];
    let pendingActions: AgentPendingActionRecord[] = [];

    try {
      [agentRuns, memoryEntries, toolExecutions, pendingActions] = await Promise.all([
        agentRunRepository.listByProject(projectId),
        agentMemoryEntryRepository.listByProject(projectId),
        agentToolExecutionRepository.listByProject(projectId),
        agentPendingActionRepository.listByProject(projectId)
      ]);
    } catch (error) {
      if (!isAgentHistoryStorageError(error)) {
        throw error;
      }
    }

    return {
      tasks,
      riskFlags,
      comments,
      processingRuns,
      agentRuns,
      toolExecutions,
      pendingActions,
      memoryEntries
    };
  },
  async approvePendingAgentAction(requestUser: AuthenticatedUser, projectId: string, pendingActionId: string) {
    const project = await this.getProject(requestUser, projectId);

    if (!canEditProject(requestUser, project.ownerId)) {
      throw new ApiError(403, "Only the project owner or admin can approve agent review actions.");
    }

    const pendingAction = await agentPendingActionRepository.findById(pendingActionId);

    if (!pendingAction || pendingAction.projectId !== projectId) {
      throw new ApiError(404, "Pending agent action not found.");
    }

    if (pendingAction.status !== "pending") {
      throw new ApiError(400, "This agent review action has already been resolved.");
    }

    const parsedInput = pendingAction.inputJson ? JSON.parse(pendingAction.inputJson) as Record<string, unknown> : {};

    let resultSummary = "Agent action approved.";
    let outputJson: string | undefined;

    if (pendingAction.actionType === "assign_document") {
      const documentId = typeof parsedInput.documentId === "string" ? parsedInput.documentId : "";
      const assignedTo = typeof parsedInput.assignedTo === "string" ? parsedInput.assignedTo : undefined;
      const document = await projectDocumentRepository.findById(projectId, documentId);

      if (!document) {
        throw new ApiError(404, "Document not found.");
      }

      const updatedDocument = await projectDocumentRepository.update(projectId, documentId, {
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

      resultSummary = assignedTo
        ? `${document.title} was assigned to ${assignedTo}.`
        : `${document.title} remained unassigned.`;
      outputJson = JSON.stringify(updatedDocument ?? document);
      await agentMemoryEntryRepository.createMany([
        {
          projectId,
          documentId,
          runId: pendingAction.runId,
          kind: "document_assignment",
          title: document.title,
          content: assignedTo ? `Approved assignment to ${assignedTo}.` : "Approved leaving the document unassigned."
        }
      ]);
    }

    if (pendingAction.actionType === "add_project_comment") {
      const createdComment = await agentToolsService.addProjectComment({
        projectId,
        sourceDocumentId: typeof parsedInput.sourceDocumentId === "string" ? parsedInput.sourceDocumentId : undefined,
        authorName: typeof parsedInput.authorName === "string" ? parsedInput.authorName : "ChangeFlow Agent",
        body: typeof parsedInput.body === "string" ? parsedInput.body : pendingAction.summary,
        createdByAgent: true
      });

      resultSummary = "Approved and posted the agent project note.";
      outputJson = createdComment ? JSON.stringify(createdComment) : undefined;
      if (createdComment) {
        await agentMemoryEntryRepository.createMany([
          {
            projectId,
            documentId: createdComment.sourceDocumentId,
            runId: pendingAction.runId,
            kind: "project_comment",
            title: createdComment.authorName,
            content: createdComment.body
          }
        ]);
      }
    }

    if (pendingAction.actionType === "suggest_change_order_follow_up") {
      const createdComment = await agentToolsService.suggestChangeOrderFollowUp({
        projectId,
        sourceDocumentId: typeof parsedInput.sourceDocumentId === "string" ? parsedInput.sourceDocumentId : undefined,
        authorName: typeof parsedInput.authorName === "string" ? parsedInput.authorName : "ChangeFlow Agent",
        message: typeof parsedInput.message === "string" ? parsedInput.message : pendingAction.summary
      });

      resultSummary = "Approved and posted the change-order follow-up note.";
      outputJson = createdComment ? JSON.stringify(createdComment) : undefined;
      if (createdComment) {
        await agentMemoryEntryRepository.createMany([
          {
            projectId,
            documentId: createdComment.sourceDocumentId,
            runId: pendingAction.runId,
            kind: "change_order_follow_up",
            title: createdComment.authorName,
            content: createdComment.body
          }
        ]);
      }
    }

    const approvedAction = await agentPendingActionRepository.markApproved(pendingActionId, requestUser.id);

    await agentToolExecutionRepository.create({
      runId: pendingAction.runId,
      toolName: pendingAction.actionType,
      status: "approved",
      title: pendingAction.title,
      resultSummary,
      inputJson: pendingAction.inputJson,
      outputJson
    });

    return approvedAction;
  },
  async dismissPendingAgentAction(requestUser: AuthenticatedUser, projectId: string, pendingActionId: string) {
    const project = await this.getProject(requestUser, projectId);

    if (!canEditProject(requestUser, project.ownerId)) {
      throw new ApiError(403, "Only the project owner or admin can dismiss agent review actions.");
    }

    const pendingAction = await agentPendingActionRepository.findById(pendingActionId);

    if (!pendingAction || pendingAction.projectId !== projectId) {
      throw new ApiError(404, "Pending agent action not found.");
    }

    if (pendingAction.status !== "pending") {
      throw new ApiError(400, "This agent review action has already been resolved.");
    }

    const dismissedAction = await agentPendingActionRepository.markDismissed(pendingActionId, requestUser.id);

    await agentToolExecutionRepository.create({
      runId: pendingAction.runId,
      toolName: pendingAction.actionType,
      status: "dismissed",
      title: pendingAction.title,
      resultSummary: "The proposed agent action was dismissed by a reviewer.",
      inputJson: pendingAction.inputJson
    });

    return dismissedAction;
  },
  async listProjectTasks(requestUser: AuthenticatedUser) {
    const accessibleProjectIds = await projectAccessService.listAccessibleProjectIds(requestUser, {
      includeArchived: true
    });
    const tasks = await projectTaskRepository.listAll();
    return tasks.filter((task) => accessibleProjectIds.includes(task.projectId));
  },
  async getProjectTask(requestUser: AuthenticatedUser, taskId: string) {
    const task = await projectTaskRepository.findById(taskId);

    if (!task) {
      throw new ApiError(404, "Task not found.");
    }

    await this.getProject(requestUser, task.projectId);
    return task;
  },
  async listProjectRiskFlags(requestUser: AuthenticatedUser) {
    const accessibleProjectIds = await projectAccessService.listAccessibleProjectIds(requestUser, {
      includeArchived: true
    });
    const riskFlags = await projectRiskFlagRepository.listAll();
    return riskFlags.filter((riskFlag) => accessibleProjectIds.includes(riskFlag.projectId));
  },
  async getProjectRiskFlag(requestUser: AuthenticatedUser, riskFlagId: string) {
    const riskFlag = await projectRiskFlagRepository.findById(riskFlagId);

    if (!riskFlag) {
      throw new ApiError(404, "Risk flag not found.");
    }

    await this.getProject(requestUser, riskFlag.projectId);
    return riskFlag;
  },
  async updateProjectTaskStatus(
    requestUser: AuthenticatedUser,
    taskId: string,
    input: { status: "suggested" | "open" | "in_progress" | "done" }
  ) {
    await this.getProjectTask(requestUser, taskId);

    const updatedTask = await projectTaskRepository.updateStatus(taskId, input.status);

    if (!updatedTask) {
      throw new ApiError(404, "Task not found.");
    }

    await auditLogService.record("project.task.status_updated", "projectTask", updatedTask.id, {
      projectId: updatedTask.projectId,
      status: updatedTask.status
    });

    return updatedTask;
  },
  async updateProjectRiskFlagStatus(
    requestUser: AuthenticatedUser,
    riskFlagId: string,
    input: { status: "open" | "reviewed" | "mitigated" }
  ) {
    await this.getProjectRiskFlag(requestUser, riskFlagId);

    const updatedRiskFlag = await projectRiskFlagRepository.updateStatus(riskFlagId, input.status);

    if (!updatedRiskFlag) {
      throw new ApiError(404, "Risk flag not found.");
    }

    await auditLogService.record("project.risk_flag.status_updated", "projectRiskFlag", updatedRiskFlag.id, {
      projectId: updatedRiskFlag.projectId,
      status: updatedRiskFlag.status
    });

    return updatedRiskFlag;
  },
  async askProjectQuestion(requestUser: AuthenticatedUser, projectId: string, input: { question: string }) {
    await this.getProject(requestUser, projectId);
    return ragService.answerProjectQuestion({
      projectId,
      question: input.question.trim()
    });
  },
  async addDocument(
    user: AuthenticatedUser,
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
    const project = await this.getProject(user, projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can add documents.");
    }

    const teamMembers = await projectTeamMemberRepository.listByProject(projectId);
    const assignedTo = autoAssignDocumentToTeamMember(input, teamMembers);

    const document = await projectDocumentRepository.create({
      projectId,
      title: input.title,
      kind: input.kind,
      summary: input.summary,
      aiSummary: undefined,
      agentStatus: "queued",
      processingError: undefined,
      lastProcessedAt: undefined,
      assignedTo,
      url: input.url?.trim() ? input.url.trim() : undefined,
      storageKey: input.storageKey,
      fileName: input.fileName,
      contentType: input.contentType,
      fileSize: input.fileSize
    });

    await auditLogService.record("project.document.created", "projectDocument", document.id, {
      projectId,
      title: document.title,
      kind: document.kind,
      assignedTo: document.assignedTo
    });

    return documentAgentService.processProjectDocument({
      project,
      document,
      teamMembers,
      trigger: "document_upload"
    });
  },
  async updateDocument(
    user: AuthenticatedUser,
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
    const project = await this.getProject(user, projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can edit documents.");
    }

    const teamMembers = await projectTeamMemberRepository.listByProject(projectId);
    const assignedTo = autoAssignDocumentToTeamMember(input, teamMembers);

    const updatedDocument = await projectDocumentRepository.update(projectId, documentId, {
      title: input.title.trim(),
      kind: input.kind.trim(),
      summary: input.summary.trim(),
      assignedTo,
      url: input.url?.trim() ? input.url.trim() : undefined
    });

    if (!updatedDocument) {
      throw new ApiError(404, "Document not found.");
    }

    await auditLogService.record("project.document.updated", "projectDocument", updatedDocument.id, {
      projectId,
      title: updatedDocument.title,
      kind: updatedDocument.kind,
      assignedTo: updatedDocument.assignedTo
    });

    return updatedDocument;
  },
  async removeDocument(user: AuthenticatedUser, projectId: string, documentId: string) {
    const project = await this.getProject(user, projectId);

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
    user: AuthenticatedUser,
    projectId: string,
    input: {
      fileName: string;
      contentType?: string;
      fileSize: number;
    }
  ) {
    const project = await this.getProject(user, projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can upload documents.");
    }

    return storageService.createProjectDocumentUploadIntent({
      projectId,
      fileName: input.fileName,
      contentType: input.contentType,
      fileSize: input.fileSize
    });
  },
  async getDocumentDownloadUrl(user: AuthenticatedUser, projectId: string, documentId: string) {
    await this.getProject(user, projectId);

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
  async reprocessDocument(user: AuthenticatedUser, projectId: string, documentId: string) {
    const project = await this.getProject(user, projectId);

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can reprocess documents.");
    }

    const document = await projectDocumentRepository.findById(projectId, documentId);

    if (!document) {
      throw new ApiError(404, "Document not found.");
    }

    const teamMembers = await projectTeamMemberRepository.listByProject(projectId);

    const queuedDocument = await projectDocumentRepository.update(projectId, documentId, {
      title: document.title,
      kind: document.kind,
      summary: document.summary,
      aiSummary: document.aiSummary,
      agentStatus: "queued",
      processingError: "",
      lastProcessedAt: document.lastProcessedAt,
      assignedTo: document.assignedTo,
      url: document.url
    });

    await auditLogService.record("project.document.reprocess_requested", "projectDocument", document.id, {
      projectId
    });

    return documentAgentService.processProjectDocument({
      project,
      document: queuedDocument ?? document,
      teamMembers,
      trigger: "manual_reprocess"
    });
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
    const project = await this.getProject(user, projectId);

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
    const project = await this.getProject(user, projectId);

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
  },
  async requestProjectAccess(
    user: AuthenticatedUser,
    projectId: string,
    input?: {
      message?: string;
    }
  ) {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    if (user.role === "admin" || project.ownerId === user.id) {
      throw new ApiError(400, "You already have access to this project.");
    }

    const accessibleProjectIds = await projectAccessService.listAccessibleProjectIds(user, { includeArchived: true });

    if (accessibleProjectIds.includes(projectId)) {
      throw new ApiError(400, "You already have access to this project.");
    }

    const existingPendingRequest = await projectAccessRequestRepository.findPendingByUserAndProject(user.id, projectId);

    if (existingPendingRequest) {
      return existingPendingRequest;
    }

    const createdRequest = await projectAccessRequestRepository.create({
      userId: user.id,
      projectId,
      message: input?.message
    });

    if (!createdRequest) {
      throw new ApiError(500, "Unable to create the access request.");
    }

    await auditLogService.record("project.access_request.created", "project", projectId, {
      userId: user.id
    });

    return createdRequest;
  },
  async listProjectAccessRequests(user: AuthenticatedUser) {
    if (user.role !== "admin") {
      throw new ApiError(403, "Only admins can review project access requests.");
    }

    return projectAccessRequestRepository.listPending();
  },
  async approveProjectAccessRequest(user: AuthenticatedUser, requestId: string) {
    if (user.role !== "admin") {
      throw new ApiError(403, "Only admins can approve project access requests.");
    }

    const updatedRequest = await projectAccessRequestRepository.updateStatus(requestId, {
      status: "approved",
      handledById: user.id
    });

    if (!updatedRequest) {
      throw new ApiError(404, "Access request not found.");
    }

    await projectAccessRepository.grantAccess({
      userId: updatedRequest.userId,
      projectId: updatedRequest.projectId,
      grantedById: user.id
    });

    await auditLogService.record("project.access_request.approved", "project", updatedRequest.projectId, {
      requestId: updatedRequest.id,
      userId: updatedRequest.userId
    });

    return updatedRequest;
  },
  async rejectProjectAccessRequest(user: AuthenticatedUser, requestId: string) {
    if (user.role !== "admin") {
      throw new ApiError(403, "Only admins can reject project access requests.");
    }

    const updatedRequest = await projectAccessRequestRepository.updateStatus(requestId, {
      status: "rejected",
      handledById: user.id
    });

    if (!updatedRequest) {
      throw new ApiError(404, "Access request not found.");
    }

    await auditLogService.record("project.access_request.rejected", "project", updatedRequest.projectId, {
      requestId: updatedRequest.id,
      userId: updatedRequest.userId
    });

    return updatedRequest;
  }
};
