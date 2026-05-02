import { agentMemoryEntryRepository } from "../repositories/agentMemoryEntry.repository.js";
import { agentPendingActionRepository } from "../repositories/agentPendingAction.repository.js";
import { agentToolExecutionRepository } from "../repositories/agentToolExecution.repository.js";
import { agentRunRepository } from "../repositories/agentRun.repository.js";
import type { AgentMemoryEntryRecord, ChangeOrderRecord, ProjectCommentRecord, ProjectDocumentRecord, ProjectRecord, ProjectRiskFlagRecord, ProjectTaskRecord, ProjectTeamMemberRecord } from "../types/domain.js";
import { aiSummaryService } from "./aiSummary.service.js";
import { agentToolsService } from "./agentTools.service.js";

function normalizeAssignee(candidate: string | undefined, teamMembers: ProjectTeamMemberRecord[]) {
  if (!candidate?.trim()) {
    return undefined;
  }

  const normalizedCandidate = candidate.trim().toLowerCase();
  const match = teamMembers.find((member) => member.name.trim().toLowerCase() === normalizedCandidate);
  return match?.name ?? candidate.trim();
}

function serializeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

export const agentOrchestratorService = {
  async runDocumentFlow(input: {
    project: ProjectRecord;
    document: ProjectDocumentRecord;
    teamMembers: ProjectTeamMemberRecord[];
    changeOrders: ChangeOrderRecord[];
    extractedText?: string;
    memoryEntries?: AgentMemoryEntryRecord[];
    agentRunId?: string;
  }) {
    const classification = await aiSummaryService.classifyProjectDocument({
      document: input.document,
      extractedText: input.extractedText
    });

    if (input.agentRunId) {
      await agentRunRepository.addStep({
        runId: input.agentRunId,
        stepType: "classification",
        status: "completed",
        title: "Classified document type",
        details: `${classification.documentType} (${classification.confidence}) • ${classification.rationale}`
      });
    }

    const riskAnalysis = await aiSummaryService.analyzeProjectDocumentRisks({
      project: input.project,
      document: input.document,
      classification,
      extractedText: input.extractedText
    });

    if (input.agentRunId) {
      await agentRunRepository.addStep({
        runId: input.agentRunId,
        stepType: "risk_analysis",
        status: "completed",
        title: "Analyzed document risks",
        details:
          riskAnalysis.keyRisks.length > 0
            ? riskAnalysis.keyRisks.map((risk) => `${risk.level}: ${risk.title}`).join(" • ")
            : "No material risks were identified."
      });
    }

    const actionPlan = await aiSummaryService.planProjectDocumentActions({
      project: input.project,
      document: input.document,
      teamMembers: input.teamMembers,
      changeOrders: input.changeOrders,
      classification,
      riskAnalysis,
      extractedText: input.extractedText,
      memoryEntries: (input.memoryEntries ?? []).slice(0, 5).map((entry) => ({
        kind: entry.kind,
        title: entry.title,
        content: entry.content
      }))
    });

    if (input.agentRunId) {
      await agentRunRepository.addStep({
        runId: input.agentRunId,
        stepType: "action_planning",
        status: "completed",
        title: "Planned next-step actions",
        details: `${actionPlan.actionItems.length} task candidate${actionPlan.actionItems.length === 1 ? "" : "s"} and ${riskAnalysis.keyRisks.length} risk recommendation${riskAnalysis.keyRisks.length === 1 ? "" : "s"} prepared.`
      });
    }

    const assignedTo = normalizeAssignee(actionPlan.suggestedAssignee ?? input.document.assignedTo, input.teamMembers);
    let updatedDocument: ProjectDocumentRecord | null = null;
    const queuedPendingActions: Array<{ actionType: string; title: string }> = [];

    if (
      input.agentRunId &&
      assignedTo &&
      assignedTo !== input.document.assignedTo
    ) {
      await agentPendingActionRepository.create({
        runId: input.agentRunId,
        projectId: input.project.id,
        documentId: input.document.id,
        actionType: "assign_document",
        status: "pending",
        title: `Review assignment to ${assignedTo}`,
        summary: `The agent recommends assigning ${input.document.title} to ${assignedTo}.`,
        inputJson: serializeJson({
          documentId: input.document.id,
          assignedTo,
          previousAssignedTo: input.document.assignedTo
        })
      });
      queuedPendingActions.push({
        actionType: "assign_document",
        title: `Queued assignment review for ${assignedTo}`
      });
    } else {
      updatedDocument = input.document;
    }

    const createdTasks: ProjectTaskRecord[] = [];

    for (const item of actionPlan.actionItems) {
      const task = await agentToolsService.createProjectTask({
          projectId: input.project.id,
          sourceDocumentId: input.document.id,
          title: item.title,
          description: item.description,
          status: "suggested",
          assignedTo: normalizeAssignee(item.assignee ?? assignedTo, input.teamMembers),
          createdByAgent: true
        });

      if (task) {
        createdTasks.push(task);
      }

      if (input.agentRunId) {
        await agentToolExecutionRepository.create({
          runId: input.agentRunId,
          toolName: "create_project_task",
          status: task ? "completed" : "skipped",
          title: `Create task: ${item.title}`,
          resultSummary: task
            ? `${task.title} was added as a suggested task${task.assignedTo ? ` for ${task.assignedTo}` : ""}.`
            : `Task creation for ${item.title} was skipped because the backend did not persist a task record.`,
          inputJson: serializeJson({
            projectId: input.project.id,
            sourceDocumentId: input.document.id,
            title: item.title,
            description: item.description,
            assignedTo: normalizeAssignee(item.assignee ?? assignedTo, input.teamMembers)
          }),
          outputJson: serializeJson(task)
        });
      }
    }

    const createdRiskFlags: ProjectRiskFlagRecord[] = [];

    for (const risk of riskAnalysis.keyRisks) {
      const riskFlag = await agentToolsService.createRiskFlag({
          projectId: input.project.id,
          sourceDocumentId: input.document.id,
          level: risk.level,
          title: risk.title,
          description: risk.description,
          status: "open",
          createdByAgent: true
        });

      if (riskFlag) {
        createdRiskFlags.push(riskFlag);
      }

      if (input.agentRunId) {
        await agentToolExecutionRepository.create({
          runId: input.agentRunId,
          toolName: "create_risk_flag",
          status: riskFlag ? "completed" : "skipped",
          title: `Flag risk: ${risk.title}`,
          resultSummary: riskFlag
            ? `${risk.level.toUpperCase()} risk "${risk.title}" was posted to the project workspace.`
            : `Risk flag creation for ${risk.title} was skipped because the backend did not persist a risk record.`,
          inputJson: serializeJson({
            projectId: input.project.id,
            sourceDocumentId: input.document.id,
            level: risk.level,
            title: risk.title,
            description: risk.description
          }),
          outputJson: serializeJson(riskFlag)
        });
      }
    }

    let createdComment: ProjectCommentRecord | null = null;

    if (input.agentRunId) {
      await agentPendingActionRepository.create({
        runId: input.agentRunId,
        projectId: input.project.id,
        documentId: input.document.id,
        actionType: "add_project_comment",
        status: "pending",
        title: "Review agent project note",
        summary: "The agent prepared a project-facing summary note for the team.",
        inputJson: serializeJson({
          projectId: input.project.id,
          sourceDocumentId: input.document.id,
          authorName: "ChangeFlow Agent",
          body: actionPlan.projectComment,
          createdByAgent: true
        })
      });
      queuedPendingActions.push({
        actionType: "add_project_comment",
        title: "Queued project note review"
      });
    }

    let changeOrderFollowUpComment: ProjectCommentRecord | null = null;

    if (actionPlan.changeOrderFollowUp) {
      if (input.agentRunId) {
        await agentPendingActionRepository.create({
          runId: input.agentRunId,
          projectId: input.project.id,
          documentId: input.document.id,
          actionType: "suggest_change_order_follow_up",
          status: "pending",
          title: "Review change-order follow-up note",
          summary: "The agent recommends posting a change-order follow-up note for this document.",
          inputJson: serializeJson({
            projectId: input.project.id,
            sourceDocumentId: input.document.id,
            authorName: "ChangeFlow Agent",
            message: actionPlan.changeOrderFollowUp
          })
        });
        queuedPendingActions.push({
          actionType: "suggest_change_order_follow_up",
          title: "Queued change-order follow-up review"
        });
      }
    }

    if (input.agentRunId) {
      await agentRunRepository.addStep({
        runId: input.agentRunId,
        stepType: "tool_execution",
        status: "completed",
        title: "Executed agent tools",
        details: `Executed ${createdTasks.length} task${createdTasks.length === 1 ? "" : "s"} and ${createdRiskFlags.length} risk flag${createdRiskFlags.length === 1 ? "" : "s"}. Queued ${queuedPendingActions.length} review action${queuedPendingActions.length === 1 ? "" : "s"} for owner/admin approval.`
      });
    }

    await agentMemoryEntryRepository.createMany([
      {
        projectId: input.project.id,
        documentId: input.document.id,
        runId: input.agentRunId,
        kind: "document_classification",
        title: input.document.title,
        content: `${classification.documentType} (${classification.confidence})`
      },
      {
        projectId: input.project.id,
        documentId: input.document.id,
        runId: input.agentRunId,
        kind: "document_summary",
        title: input.document.title,
        content: actionPlan.summary
      },
      ...actionPlan.actionItems.map((item) => ({
        projectId: input.project.id,
        documentId: input.document.id,
        runId: input.agentRunId,
        kind: "action_item",
        title: item.title,
        content: `${item.description}${item.assignee ? ` Assigned to ${item.assignee}.` : ""}`
      })),
      ...riskAnalysis.keyRisks.map((risk) => ({
        projectId: input.project.id,
        documentId: input.document.id,
        runId: input.agentRunId,
        kind: "risk_flag",
        title: risk.title,
        content: `[${risk.level.toUpperCase()}] ${risk.description}`
      }))
    ]);

    return {
      classification,
      riskAnalysis,
      actionPlan,
      assignedTo,
      updatedDocument,
      createdTasks: createdTasks.filter(Boolean) as ProjectTaskRecord[],
      createdRiskFlags: createdRiskFlags.filter(Boolean) as ProjectRiskFlagRecord[],
      createdComment,
      changeOrderFollowUpComment
    };
  }
};
