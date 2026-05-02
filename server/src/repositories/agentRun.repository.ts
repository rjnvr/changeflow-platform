import { prisma } from "../config/db.js";
import type { AgentRunRecord, AgentStepRecord } from "../types/domain.js";

type AgentStepRow = {
  id: string;
  runId: string;
  stepType: string;
  status: string;
  title: string;
  details: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AgentRunRow = {
  id: string;
  projectId: string;
  documentId: string | null;
  trigger: string;
  status: string;
  summary: string | null;
  model: string | null;
  steps: AgentStepRow[];
  createdAt: Date;
  updatedAt: Date;
};

const agentRunClient = (prisma as unknown as {
  agentRun: {
    create(args: unknown): Promise<AgentRunRow>;
    update(args: unknown): Promise<AgentRunRow>;
    findMany(args: unknown): Promise<AgentRunRow[]>;
  };
  agentStep: {
    create(args: unknown): Promise<AgentStepRow>;
  };
}).agentRun;

const agentStepClient = (prisma as unknown as {
  agentStep: {
    create(args: unknown): Promise<AgentStepRow>;
  };
}).agentStep;

function mapStep(step: AgentStepRow): AgentStepRecord {
  return {
    id: step.id,
    runId: step.runId,
    stepType: step.stepType,
    status: step.status,
    title: step.title,
    details: step.details ?? undefined,
    createdAt: step.createdAt.toISOString(),
    updatedAt: step.updatedAt.toISOString()
  };
}

function mapRun(run: AgentRunRow): AgentRunRecord {
  return {
    id: run.id,
    projectId: run.projectId,
    documentId: run.documentId ?? undefined,
    trigger: run.trigger,
    status: run.status,
    summary: run.summary ?? undefined,
    model: run.model ?? undefined,
    steps: [...run.steps].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
    ).map(mapStep),
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString()
  };
}

const includeSteps = {
  steps: {
    orderBy: [{ createdAt: "asc" }]
  }
} as const;

export const agentRunRepository = {
  async create(input: {
    projectId: string;
    documentId?: string;
    trigger: string;
    status: string;
    summary?: string;
    model?: string;
  }) {
    if (!agentRunClient) {
      return null;
    }

    const run = await agentRunClient.create({
      data: {
        projectId: input.projectId,
        documentId: input.documentId,
        trigger: input.trigger,
        status: input.status,
        summary: input.summary,
        model: input.model
      },
      include: includeSteps
    });

    return mapRun(run);
  },
  async update(
    runId: string,
    input: Partial<{
      status: string;
      summary: string;
      model: string;
    }>
  ) {
    if (!agentRunClient) {
      return null;
    }

    const run = await agentRunClient.update({
      where: { id: runId },
      data: {
        status: input.status,
        summary: input.summary,
        model: input.model
      },
      include: includeSteps
    });

    return mapRun(run);
  },
  async addStep(input: {
    runId: string;
    stepType: string;
    status: string;
    title: string;
    details?: string;
  }) {
    if (!agentStepClient) {
      return null;
    }

    const step = await agentStepClient.create({
      data: {
        runId: input.runId,
        stepType: input.stepType,
        status: input.status,
        title: input.title,
        details: input.details
      }
    });

    return mapStep(step);
  },
  async listByProject(projectId: string) {
    if (!agentRunClient) {
      return [];
    }

    const runs = await agentRunClient.findMany({
      where: { projectId },
      include: includeSteps,
      orderBy: [{ createdAt: "desc" }]
    });

    return runs.map(mapRun);
  }
};
