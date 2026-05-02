import { prisma } from "../config/db.js";
import type { AgentPendingActionRecord } from "../types/domain.js";

type AgentPendingActionRow = {
  id: string;
  runId: string;
  projectId: string;
  documentId: string | null;
  actionType: AgentPendingActionRecord["actionType"];
  status: AgentPendingActionRecord["status"];
  title: string;
  summary: string;
  inputJson: string | null;
  approvedById: string | null;
  approvedAt: Date | null;
  dismissedById: string | null;
  dismissedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const agentPendingActionClient = (prisma as unknown as {
  agentPendingAction?: {
    create(args: unknown): Promise<AgentPendingActionRow>;
    findMany(args: unknown): Promise<AgentPendingActionRow[]>;
    findFirst(args: unknown): Promise<AgentPendingActionRow | null>;
    update(args: unknown): Promise<AgentPendingActionRow>;
    deleteMany(args: unknown): Promise<{ count: number }>;
  };
}).agentPendingAction;

function isMissingPendingActionStorage(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("P2021") ||
      error.message.includes("does not exist") ||
      error.message.includes("AgentPendingAction"))
  );
}

function mapPendingAction(action: AgentPendingActionRow): AgentPendingActionRecord {
  return {
    id: action.id,
    runId: action.runId,
    projectId: action.projectId,
    documentId: action.documentId ?? undefined,
    actionType: action.actionType,
    status: action.status,
    title: action.title,
    summary: action.summary,
    inputJson: action.inputJson ?? undefined,
    approvedById: action.approvedById ?? undefined,
    approvedAt: action.approvedAt?.toISOString(),
    dismissedById: action.dismissedById ?? undefined,
    dismissedAt: action.dismissedAt?.toISOString(),
    createdAt: action.createdAt.toISOString(),
    updatedAt: action.updatedAt.toISOString()
  };
}

export const agentPendingActionRepository = {
  async create(input: Omit<AgentPendingActionRecord, "id" | "createdAt" | "updatedAt">) {
    if (!agentPendingActionClient) {
      return null;
    }

    const action = await agentPendingActionClient.create({
      data: {
        runId: input.runId,
        projectId: input.projectId,
        documentId: input.documentId,
        actionType: input.actionType,
        status: input.status,
        title: input.title,
        summary: input.summary,
        inputJson: input.inputJson,
        approvedById: input.approvedById,
        approvedAt: input.approvedAt ? new Date(input.approvedAt) : undefined,
        dismissedById: input.dismissedById,
        dismissedAt: input.dismissedAt ? new Date(input.dismissedAt) : undefined
      }
    }).catch((error: unknown) => {
      if (isMissingPendingActionStorage(error)) {
        return null;
      }

      throw error;
    });

    return action ? mapPendingAction(action) : null;
  },
  async listByProject(projectId: string) {
    if (!agentPendingActionClient) {
      return [];
    }

    const actions = await agentPendingActionClient.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }]
    }).catch((error: unknown) => {
      if (isMissingPendingActionStorage(error)) {
        return [];
      }

      throw error;
    });

    return actions.map(mapPendingAction);
  },
  async findById(pendingActionId: string) {
    if (!agentPendingActionClient) {
      return null;
    }

    const action = await agentPendingActionClient.findFirst({
      where: { id: pendingActionId }
    }).catch((error: unknown) => {
      if (isMissingPendingActionStorage(error)) {
        return null;
      }

      throw error;
    });

    return action ? mapPendingAction(action) : null;
  },
  async markApproved(pendingActionId: string, approvedById: string) {
    if (!agentPendingActionClient) {
      return null;
    }

    const action = await agentPendingActionClient.update({
      where: { id: pendingActionId },
      data: {
        status: "approved",
        approvedById,
        approvedAt: new Date(),
        dismissedById: null,
        dismissedAt: null
      }
    }).catch((error: unknown) => {
      if (isMissingPendingActionStorage(error)) {
        return null;
      }

      throw error;
    });

    return action ? mapPendingAction(action) : null;
  },
  async markDismissed(pendingActionId: string, dismissedById: string) {
    if (!agentPendingActionClient) {
      return null;
    }

    const action = await agentPendingActionClient.update({
      where: { id: pendingActionId },
      data: {
        status: "dismissed",
        dismissedById,
        dismissedAt: new Date()
      }
    }).catch((error: unknown) => {
      if (isMissingPendingActionStorage(error)) {
        return null;
      }

      throw error;
    });

    return action ? mapPendingAction(action) : null;
  },
  async deleteForDocument(projectId: string, documentId: string) {
    if (!agentPendingActionClient) {
      return;
    }

    await agentPendingActionClient.deleteMany({
      where: {
        projectId,
        documentId,
        status: "pending"
      }
    }).catch((error: unknown) => {
      if (!isMissingPendingActionStorage(error)) {
        throw error;
      }
    });
  }
};
