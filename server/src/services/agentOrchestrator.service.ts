import { agentMemoryEntryRepository } from "../repositories/agentMemoryEntry.repository.js";
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
    const updatedDocument = await agentToolsService.assignDocument(input.document, assignedTo);

    if (input.agentRunId) {
      await agentToolExecutionRepository.create({
        runId: input.agentRunId,
        toolName: "assign_document",
        status: "completed",
        title: assignedTo ? `Assigned document to ${assignedTo}` : "Kept document assignment unchanged",
        resultSummary: assignedTo
          ? `${input.document.title} is now assigned to ${assignedTo}.`
          : `${input.document.title} remained unassigned because no confident assignee was selected.`,
        inputJson: serializeJson({
          documentId: input.document.id,
          previousAssignedTo: input.document.assignedTo,
          requestedAssignedTo: actionPlan.suggestedAssignee
        }),
        outputJson: serializeJson({
          documentId: updatedDocument?.id ?? input.document.id,
          assignedTo: updatedDocument?.assignedTo ?? assignedTo
        })
      });
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

    const createdComment = await agentToolsService.addProjectComment({
      projectId: input.project.id,
      sourceDocumentId: input.document.id,
      authorName: "ChangeFlow Agent",
      body: actionPlan.projectComment,
      createdByAgent: true
    });

    if (input.agentRunId) {
      await agentToolExecutionRepository.create({
        runId: input.agentRunId,
        toolName: "add_project_comment",
        status: createdComment ? "completed" : "skipped",
        title: "Post project note",
        resultSummary: createdComment
          ? "A summarized agent note was posted to the project."
          : "The agent prepared a project note, but it was not stored.",
        inputJson: serializeJson({
          projectId: input.project.id,
          sourceDocumentId: input.document.id,
          body: actionPlan.projectComment
        }),
        outputJson: serializeJson(createdComment)
      });
    }

    let changeOrderFollowUpComment: ProjectCommentRecord | null = null;

    if (actionPlan.changeOrderFollowUp) {
      changeOrderFollowUpComment = await agentToolsService.suggestChangeOrderFollowUp({
        projectId: input.project.id,
        sourceDocumentId: input.document.id,
        authorName: "ChangeFlow Agent",
        message: actionPlan.changeOrderFollowUp
      });

      if (input.agentRunId) {
        await agentToolExecutionRepository.create({
          runId: input.agentRunId,
          toolName: "suggest_change_order_follow_up",
          status: changeOrderFollowUpComment ? "completed" : "skipped",
          title: "Suggest change-order follow-up",
          resultSummary: changeOrderFollowUpComment
            ? "A change-order follow-up recommendation was posted for the team."
            : "The agent suggested change-order follow-up, but no project note was stored.",
          inputJson: serializeJson({
            projectId: input.project.id,
            sourceDocumentId: input.document.id,
            message: actionPlan.changeOrderFollowUp
          }),
          outputJson: serializeJson(changeOrderFollowUpComment)
        });
      }
    }

    if (input.agentRunId) {
      await agentRunRepository.addStep({
        runId: input.agentRunId,
        stepType: "tool_execution",
        status: "completed",
        title: "Executed agent tools",
        details: `Created ${createdTasks.length} task${createdTasks.length === 1 ? "" : "s"}, ${createdRiskFlags.length} risk flag${createdRiskFlags.length === 1 ? "" : "s"}, and ${changeOrderFollowUpComment ? "2" : "1"} project comment${changeOrderFollowUpComment ? "s" : ""}.`
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
