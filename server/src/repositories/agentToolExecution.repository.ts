import { prisma } from "../config/db.js";
import type { AgentToolExecutionRecord } from "../types/domain.js";

type AgentToolExecutionRow = {
  id: string;
  runId: string;
  toolName: string;
  status: string;
  title: string;
  resultSummary: string | null;
  inputJson: string | null;
  outputJson: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const agentToolExecutionClient = (prisma as unknown as {
  agentToolExecution?: {
    create(args: unknown): Promise<AgentToolExecutionRow>;
    findMany(args: unknown): Promise<AgentToolExecutionRow[]>;
  };
}).agentToolExecution;

function isMissingToolExecutionStorage(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("P2021") ||
      error.message.includes("does not exist") ||
      error.message.includes("AgentToolExecution"))
  );
}

function mapToolExecution(execution: AgentToolExecutionRow): AgentToolExecutionRecord {
  return {
    id: execution.id,
    runId: execution.runId,
    toolName: execution.toolName,
    status: execution.status,
    title: execution.title,
    resultSummary: execution.resultSummary ?? undefined,
    inputJson: execution.inputJson ?? undefined,
    outputJson: execution.outputJson ?? undefined,
    createdAt: execution.createdAt.toISOString(),
    updatedAt: execution.updatedAt.toISOString()
  };
}

export const agentToolExecutionRepository = {
  async create(input: {
    runId: string;
    toolName: string;
    status: string;
    title: string;
    resultSummary?: string;
    inputJson?: string;
    outputJson?: string;
  }) {
    if (!agentToolExecutionClient) {
      return null;
    }

    const execution = await agentToolExecutionClient.create({
      data: {
        runId: input.runId,
        toolName: input.toolName,
        status: input.status,
        title: input.title,
        resultSummary: input.resultSummary,
        inputJson: input.inputJson,
        outputJson: input.outputJson
      }
    }).catch((error: unknown) => {
      if (isMissingToolExecutionStorage(error)) {
        return null;
      }

      throw error;
    });

    if (!execution) {
      return null;
    }

    return mapToolExecution(execution);
  },
  async listByProject(projectId: string) {
    if (!agentToolExecutionClient) {
      return [];
    }

    const executions = await agentToolExecutionClient.findMany({
      where: {
        run: {
          projectId
        }
      },
      orderBy: [{ createdAt: "desc" }]
    }).catch((error: unknown) => {
      if (isMissingToolExecutionStorage(error)) {
        return [];
      }

      throw error;
    });

    return executions.map(mapToolExecution);
  }
};
