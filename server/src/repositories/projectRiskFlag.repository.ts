import { prisma } from "../config/db.js";
import type { ProjectRiskFlagRecord } from "../types/domain.js";

type ProjectRiskFlagRow = {
  id: string;
  projectId: string;
  project: { name: string } | null;
  sourceDocumentId: string | null;
  level: string;
  title: string;
  description: string;
  status: string;
  createdByAgent: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const projectRiskFlagClient = (prisma as unknown as {
  projectRiskFlag: {
    findMany(args: unknown): Promise<ProjectRiskFlagRow[]>;
    create(args: unknown): Promise<ProjectRiskFlagRow>;
    findFirst(args: unknown): Promise<ProjectRiskFlagRow | null>;
    update(args: unknown): Promise<ProjectRiskFlagRow>;
  };
}).projectRiskFlag;

function mapProjectRiskFlag(riskFlag: ProjectRiskFlagRow): ProjectRiskFlagRecord {
  return {
    id: riskFlag.id,
    projectId: riskFlag.projectId,
    projectName: riskFlag.project?.name ?? undefined,
    sourceDocumentId: riskFlag.sourceDocumentId ?? undefined,
    level: riskFlag.level,
    title: riskFlag.title,
    description: riskFlag.description,
    status: riskFlag.status,
    createdByAgent: riskFlag.createdByAgent,
    createdAt: riskFlag.createdAt.toISOString(),
    updatedAt: riskFlag.updatedAt.toISOString()
  };
}

const includeProject = {
  project: {
    select: {
      name: true
    }
  }
} as const;

export const projectRiskFlagRepository = {
  async listByProject(projectId: string) {
    const riskFlags = await projectRiskFlagClient.findMany({
      where: { projectId },
      include: includeProject,
      orderBy: [{ createdAt: "desc" }]
    });

    return riskFlags.map(mapProjectRiskFlag);
  },
  async listAll() {
    const riskFlags = await projectRiskFlagClient.findMany({
      include: includeProject,
      orderBy: [{ createdAt: "desc" }]
    });

    return riskFlags.map(mapProjectRiskFlag);
  },
  async create(input: Omit<ProjectRiskFlagRecord, "id" | "createdAt" | "updatedAt">) {
    const riskFlag = await projectRiskFlagClient.create({
      data: {
        projectId: input.projectId,
        sourceDocumentId: input.sourceDocumentId,
        level: input.level,
        title: input.title,
        description: input.description,
        status: input.status,
        createdByAgent: input.createdByAgent
      },
      include: includeProject
    });

    return mapProjectRiskFlag(riskFlag);
  },
  async updateStatus(riskFlagId: string, status: string) {
    const existingRiskFlag = await projectRiskFlagClient.findFirst({
      where: { id: riskFlagId },
      include: includeProject
    });

    if (!existingRiskFlag) {
      return null;
    }

    const riskFlag = await projectRiskFlagClient.update({
      where: { id: riskFlagId },
      data: { status },
      include: includeProject
    });

    return mapProjectRiskFlag(riskFlag);
  }
};
