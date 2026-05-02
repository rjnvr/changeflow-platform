import { logger } from "../config/logger.js";
import { changeOrderRepository } from "../repositories/changeOrder.repository.js";
import { documentProcessingRunRepository } from "../repositories/documentProcessingRun.repository.js";
import { projectDocumentRepository } from "../repositories/projectDocument.repository.js";
import { projectRiskFlagRepository } from "../repositories/projectRiskFlag.repository.js";
import { projectTaskRepository } from "../repositories/projectTask.repository.js";
import { projectCommentRepository } from "../repositories/projectComment.repository.js";
import { documentChunkRepository } from "../repositories/documentChunk.repository.js";
import { agentMemoryEntryRepository } from "../repositories/agentMemoryEntry.repository.js";
import { agentRunRepository } from "../repositories/agentRun.repository.js";
import type { ProjectDocumentRecord, ProjectRecord, ProjectTeamMemberRecord } from "../types/domain.js";
import { agentOrchestratorService } from "./agentOrchestrator.service.js";
import { auditLogService } from "./auditLog.service.js";
import { env } from "../config/env.js";
import { documentExtractionService } from "./documentExtraction.service.js";
import { embeddingService } from "./embedding.service.js";
import { ragService } from "./rag.service.js";

function isAgentHistoryStorageError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("P2021") ||
    error.message.includes("does not exist") ||
    error.message.includes("AgentRun") ||
    error.message.includes("AgentStep") ||
    error.message.includes("AgentMemoryEntry")
  );
}

export const documentAgentService = {
  async processProjectDocument(input: {
    project: ProjectRecord;
    document: ProjectDocumentRecord;
    teamMembers: ProjectTeamMemberRecord[];
    trigger?: string;
  }) {
    const { project, document, teamMembers } = input;
    const extractionResult = await documentExtractionService.extractFromStorageObject({
      storageKey: document.storageKey,
      fileName: document.fileName,
      contentType: document.contentType
    });
    const extractionMethod = extractionResult.method;
    let agentRun: { id: string } | null = null;

    try {
      agentRun = await agentRunRepository.create({
        projectId: project.id,
        documentId: document.id,
        trigger: input.trigger ?? "document_upload",
        status: "running",
        model: env.ANTHROPIC_API_KEY ? env.ANTHROPIC_MODEL : "fallback"
      });
    } catch (error) {
      if (!isAgentHistoryStorageError(error)) {
        throw error;
      }

      logger.warn("Agent run history storage is unavailable. Continuing without Phase 3 persistence.", {
        projectId: project.id,
        documentId: document.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    const run = await documentProcessingRunRepository.create({
      projectId: project.id,
      documentId: document.id,
      status: "processing",
      extractionMethod,
      extractedTextChars: undefined,
      errorMessage: undefined
    });

    try {
      if (agentRun) {
        await agentRunRepository.addStep({
          runId: agentRun.id,
          stepType: "extraction",
          status: extractionResult.text ? "completed" : "fallback",
          title: "Document text extraction",
          details: extractionResult.text
            ? `Extracted ${extractionResult.text.length.toLocaleString()} characters using ${extractionMethod}.`
            : `No extractable text found. Proceeding with metadata fallback using ${extractionMethod}.`
        });
      }

      const extractedText = extractionResult.text.slice(0, 15000) || undefined;

      await Promise.all([
        projectTaskRepository.deleteAgentTasksForDocument(project.id, document.id),
        projectRiskFlagRepository.deleteAgentRiskFlagsForDocument(project.id, document.id),
        projectCommentRepository.deleteAgentCommentsForDocument(project.id, document.id),
        agentMemoryEntryRepository.deleteForDocument(project.id, document.id).catch((error: unknown) => {
          if (!isAgentHistoryStorageError(error)) {
            throw error;
          }
        })
      ]);

      const chunkPayload = extractedText
        ? ragService.chunkDocumentText(extractedText)
        : ragService.chunkDocumentText(
            [document.title, document.kind, document.summary, document.assignedTo ? `Assigned to ${document.assignedTo}` : ""]
              .filter(Boolean)
              .join("\n\n")
        );

      if (agentRun) {
        await agentRunRepository.addStep({
          runId: agentRun.id,
          stepType: "chunking",
          status: "completed",
          title: "Prepared document retrieval chunks",
          details: `Stored ${chunkPayload.length} chunk${chunkPayload.length === 1 ? "" : "s"} for grounded retrieval.`
        });
      }

      await documentChunkRepository.replaceForDocument(
        project.id,
        document.id,
        chunkPayload
      );

      if (embeddingService.isConfigured() && chunkPayload.length > 0) {
        const embeddings = await embeddingService.embedTexts(
          chunkPayload.map((chunk) => chunk.content),
          "document"
        );

        if (embeddings.length === chunkPayload.length) {
          await documentChunkRepository.updateEmbeddings(
            document.id,
            chunkPayload.map((chunk, index) => ({
              chunkIndex: chunk.chunkIndex,
              embedding: embeddings[index],
              embeddingModel: env.VOYAGE_EMBEDDING_MODEL
            }))
          );

          if (agentRun) {
            await agentRunRepository.addStep({
              runId: agentRun.id,
              stepType: "embedding",
              status: "completed",
              title: "Generated semantic embeddings",
              details: `Created Voyage embeddings for ${embeddings.length} chunk${embeddings.length === 1 ? "" : "s"} using ${env.VOYAGE_EMBEDDING_MODEL}.`
            });
          }
        } else {
          if (agentRun) {
            await agentRunRepository.addStep({
              runId: agentRun.id,
              stepType: "embedding",
              status: "fallback",
              title: "Embeddings skipped",
              details: "Semantic embeddings were unavailable for one or more chunks, so lexical retrieval remains the fallback."
            });
          }
        }
      } else {
        if (agentRun) {
          await agentRunRepository.addStep({
            runId: agentRun.id,
            stepType: "embedding",
            status: "fallback",
            title: "Embeddings not configured",
            details: "Voyage embeddings are not configured or no chunks were available, so semantic retrieval was not refreshed."
          });
        }
      }

      const changeOrders = await changeOrderRepository.list(project.id, { includeArchived: true });
      const memoryEntries = await agentMemoryEntryRepository.listByProject(project.id).catch((error: unknown) => {
        if (!isAgentHistoryStorageError(error)) {
          throw error;
        }

        return [];
      });
      const orchestration = await agentOrchestratorService.runDocumentFlow({
        project,
        document,
        teamMembers,
        changeOrders,
        extractedText,
        memoryEntries,
        agentRunId: agentRun?.id
      });
      const updatedDocument = await projectDocumentRepository.update(project.id, document.id, {
        title: document.title,
        kind: document.kind,
        summary: orchestration.actionPlan.summary,
        aiSummary: orchestration.actionPlan.summary,
        agentStatus: "completed",
        processingError: "",
        lastProcessedAt: new Date().toISOString(),
        assignedTo: orchestration.assignedTo,
        url: document.url
      });

      if (agentRun) {
        await agentRunRepository.addStep({
          runId: agentRun.id,
          stepType: "memory",
          status: "completed",
          title: "Stored project memory entries",
          details: `Saved classification, summary, and execution outputs for future project reasoning.`
        });
      }

      await documentProcessingRunRepository.update(run.id, {
        status: "completed",
        extractedTextChars: extractedText?.length
      });

      if (agentRun) {
        await agentRunRepository.update(agentRun.id, {
          status: "completed",
          summary: orchestration.actionPlan.summary,
          model: orchestration.actionPlan.source === "claude" ? env.ANTHROPIC_MODEL : "fallback"
        });
      }

      await auditLogService.record("project.document.agent_processed", "projectDocument", document.id, {
        projectId: project.id,
        taskCount: orchestration.createdTasks.length,
        riskCount: orchestration.createdRiskFlags.length,
        extractionMethod,
        source: orchestration.actionPlan.source,
        documentType: orchestration.classification.documentType
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

      if (agentRun) {
        await agentRunRepository.addStep({
          runId: agentRun.id,
          stepType: "failure",
          status: "failed",
          title: "Agent run failed",
          details: error instanceof Error ? error.message : "Agent processing failed."
        });

        await agentRunRepository.update(agentRun.id, {
          status: "failed",
          summary: error instanceof Error ? error.message : "Agent processing failed."
        });
      }

      return document;
    }
  }
};
