import { ProjectStatus as PrismaProjectStatus } from "@prisma/client";

import { prisma } from "../config/db.js";
import type { ProjectRecord } from "../types/domain.js";

type ProjectRow = {
  id: string;
  name: string;
  code: string;
  location: string;
  status: PrismaProjectStatus;
  archivedAt: Date | null;
  contractValue: { toNumber(): number };
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

const projectClient = (prisma as unknown as {
  project: {
    findMany(args: unknown): Promise<ProjectRow[]>;
    findUnique(args: unknown): Promise<ProjectRow | null>;
    create(args: unknown): Promise<ProjectRow>;
    update(args: unknown): Promise<ProjectRow>;
    updateMany(args: unknown): Promise<unknown>;
  };
}).project;

function fromPrismaStatus(status: PrismaProjectStatus): ProjectRecord["status"] {
  if (status === PrismaProjectStatus.on_hold) {
    return "on-hold";
  }

  return status;
}

function toPrismaStatus(status: ProjectRecord["status"]) {
  if (status === "on-hold") {
    return PrismaProjectStatus.on_hold;
  }

  return status === "completed" ? PrismaProjectStatus.completed : PrismaProjectStatus.active;
}

function mapProject(project: ProjectRow): ProjectRecord {
  return {
    id: project.id,
    name: project.name,
    code: project.code,
    location: project.location,
    status: fromPrismaStatus(project.status),
    archivedAt: project.archivedAt?.toISOString() ?? undefined,
    contractValue: project.contractValue.toNumber(),
    ownerId: project.ownerId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

export const projectRepository = {
  async list(options?: { includeArchived?: boolean }) {
    const projects = await projectClient.findMany({
      where: options?.includeArchived ? undefined : { archivedAt: null },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }]
    });

    return projects.map(mapProject);
  },
  async findById(projectId: string) {
    const project = await projectClient.findUnique({
      where: { id: projectId }
    });

    return project ? mapProject(project) : null;
  },
  async findByCode(code: string) {
    const project = await projectClient.findUnique({
      where: { code }
    });

    return project ? mapProject(project) : null;
  },
  async create(project: Omit<ProjectRecord, "id" | "createdAt" | "updatedAt">) {
    const createdProject = await projectClient.create({
      data: {
        name: project.name,
        code: project.code,
        location: project.location,
        status: toPrismaStatus(project.status),
        contractValue: project.contractValue,
        ownerId: project.ownerId
      }
    });

    return mapProject(createdProject);
  },
  async update(
    projectId: string,
    input: {
      name: string;
      code: string;
      location: string;
      status: ProjectRecord["status"];
      contractValue: number;
    }
  ) {
    const updatedProject = await projectClient.update({
      where: { id: projectId },
      data: {
        name: input.name,
        code: input.code,
        location: input.location,
        status: toPrismaStatus(input.status),
        contractValue: input.contractValue
      }
    });

    return mapProject(updatedProject);
  },
  async archive(projectId: string) {
    const archivedProject = await projectClient.update({
      where: { id: projectId },
      data: {
        archivedAt: new Date()
      }
    });

    return mapProject(archivedProject);
  },
  async bulkUpdateStatus(projectIds: string[], status: ProjectRecord["status"]) {
    if (projectIds.length === 0) {
      return [];
    }

    await projectClient.updateMany({
      where: {
        id: {
          in: projectIds
        }
      },
      data: {
        status: toPrismaStatus(status)
      }
    });

    const updatedProjects = await projectClient.findMany({
      where: {
        id: {
          in: projectIds
        }
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }]
    });

    return updatedProjects.map(mapProject);
  }
};
