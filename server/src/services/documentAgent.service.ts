import { logger } from "../config/logger.js";
import { changeOrderRepository } from "../repositories/changeOrder.repository.js";
import { documentProcessingRunRepository } from "../repositories/documentProcessingRun.repository.js";
import { projectDocumentRepository } from "../repositories/projectDocument.repository.js";
import { projectRiskFlagRepository } from "../repositories/projectRiskFlag.repository.js";
import { projectTaskRepository } from "../repositories/projectTask.repository.js";
import { documentChunkRepository } from "../repositories/documentChunk.repository.js";
import type { ProjectDocumentRecord, ProjectRecord, ProjectTeamMemberRecord } from "../types/domain.js";
import { aiSummaryService } from "./aiSummary.service.js";
import { auditLogService } from "./auditLog.service.js";
import { documentExtractionService } from "./documentExtraction.service.js";
import { ragService } from "./rag.service.js";

function normalizeAssignee(candidate: string | undefined, teamMembers: ProjectTeamMemberRecord[]) {
  if (!candidate?.trim()) {
    return undefined;
  }

  const normalizedCandidate = candidate.trim().toLowerCase();
  const match = teamMembers.find((member) => member.name.trim().toLowerCase() === normalizedCandidate);
  return match?.name ?? candidate.trim();
}

export const documentAgentService = {
  async processProjectDocument(input: {
    project: ProjectRecord;
    document: ProjectDocumentRecord;
    teamMembers: ProjectTeamMemberRecord[];
  }) {
    const { project, document, teamMembers } = input;
    const extractionResult = await documentExtractionService.extractFromStorageObject({
      storageKey: document.storageKey,
      fileName: document.fileName,
      contentType: document.contentType
    });
    const extractionMethod = extractionResult.method;

    const run = await documentProcessingRunRepository.create({
      projectId: project.id,
      documentId: document.id,
      status: "processing",
      extractionMethod,
      extractedTextChars: undefined,
      errorMessage: undefined
    });

    try {
      const extractedText = extractionResult.text.slice(0, 15000) || undefined;

      await documentChunkRepository.replaceForDocument(
        project.id,
        document.id,
        extractedText
          ? ragService.chunkDocumentText(extractedText)
          : ragService.chunkDocumentText(
              [document.title, document.kind, document.summary, document.assignedTo ? `Assigned to ${document.assignedTo}` : ""]
                .filter(Boolean)
                .join("\n\n")
            )
      );

      const changeOrders = await changeOrderRepository.list(project.id, { includeArchived: true });
      const analysis = await aiSummaryService.analyzeProjectDocument({
        project,
        document,
        teamMembers,
        changeOrders,
        extractedText
      });

      const assignedTo = normalizeAssignee(analysis.suggestedAssignee ?? document.assignedTo, teamMembers);

      const updatedDocument = await projectDocumentRepository.update(project.id, document.id, {
        title: document.title,
        kind: document.kind,
        summary: analysis.summary,
        aiSummary: analysis.summary,
        agentStatus: "completed",
        processingError: "",
        lastProcessedAt: new Date().toISOString(),
        assignedTo,
        url: document.url
      });

      const createdTasks = await Promise.all(
        analysis.actionItems.map((item) =>
            projectTaskRepository.create({
              projectId: project.id,
              sourceDocumentId: document.id,
              title: item.title,
              description: item.description,
              status: "suggested",
              assignedTo: normalizeAssignee(item.assignee ?? assignedTo, teamMembers),
              createdByAgent: true
            })
        )
      );

      const createdRiskFlags = await Promise.all(
        analysis.keyRisks.map((item) =>
            projectRiskFlagRepository.create({
              projectId: project.id,
              sourceDocumentId: document.id,
              level: item.level,
              title: item.title,
              description: item.description,
              status: "open",
              createdByAgent: true
            })
        )
      );

      await documentProcessingRunRepository.update(run.id, {
        status: "completed",
        extractedTextChars: extractedText?.length
      });

      await auditLogService.record("project.document.agent_processed", "projectDocument", document.id, {
        projectId: project.id,
        taskCount: createdTasks.length,
        riskCount: createdRiskFlags.length,
        extractionMethod,
        source: analysis.source
      });

      return updatedDocument ?? document;
    } catch (error) {
      logger.warn("Project document agent processing failed.", {
        documentId: document.id,
        projectId: project.id,
        error: error instanceof Error ? error.message : String(error)
      });

      await projectDocumentRepository.update(project.id, document.id, {
        title: document.title,
        kind: document.kind,
        summary: document.summary,
        aiSummary: document.aiSummary,
        agentStatus: "failed",
        processingError: error instanceof Error ? error.message : "Agent processing failed.",
        lastProcessedAt: new Date().toISOString(),
        assignedTo: document.assignedTo,
        url: document.url
      });

      await documentProcessingRunRepository.update(run.id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Agent processing failed."
      });

      return document;
    }
  }
};
