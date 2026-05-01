import { prisma } from "../config/db.js";
import type { ProjectTaskRecord } from "../types/domain.js";

type ProjectTaskRow = {
  id: string;
  projectId: string;
  project: { name: string } | null;
  sourceDocumentId: string | null;
  title: string;
  description: string;
  status: string;
  assignedTo: string | null;
  createdByAgent: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const projectTaskClient = (prisma as unknown as {
  projectTask: {
    findMany(args: unknown): Promise<ProjectTaskRow[]>;
    create(args: unknown): Promise<ProjectTaskRow>;
    findFirst(args: unknown): Promise<ProjectTaskRow | null>;
    update(args: unknown): Promise<ProjectTaskRow>;
    deleteMany(args: unknown): Promise<{ count: number }>;
  };
}).projectTask;

function mapProjectTask(task: ProjectTaskRow): ProjectTaskRecord {
  return {
    id: task.id,
    projectId: task.projectId,
    projectName: task.project?.name ?? undefined,
    sourceDocumentId: task.sourceDocumentId ?? undefined,
    title: task.title,
    description: task.description,
    status: task.status,
    assignedTo: task.assignedTo ?? undefined,
    createdByAgent: task.createdByAgent,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  };
}

const includeProject = {
  project: {
    select: {
      name: true
    }
  }
} as const;

export const projectTaskRepository = {
  async listByProject(projectId: string) {
    const tasks = await projectTaskClient.findMany({
      where: { projectId },
      include: includeProject,
      orderBy: [{ createdAt: "desc" }]
    });

    return tasks.map(mapProjectTask);
  },
  async listAll() {
    const tasks = await projectTaskClient.findMany({
      include: includeProject,
      orderBy: [{ createdAt: "desc" }]
    });

    return tasks.map(mapProjectTask);
  },
  async findById(taskId: string) {
    const task = await projectTaskClient.findFirst({
      where: { id: taskId },
      include: includeProject
    });

    return task ? mapProjectTask(task) : null;
  },
  async create(input: Omit<ProjectTaskRecord, "id" | "createdAt" | "updatedAt">) {
    const task = await projectTaskClient.create({
      data: {
        projectId: input.projectId,
        sourceDocumentId: input.sourceDocumentId,
        title: input.title,
        description: input.description,
        status: input.status,
        assignedTo: input.assignedTo,
        createdByAgent: input.createdByAgent
      },
      include: includeProject
    });

    return mapProjectTask(task);
  },
  async updateStatus(taskId: string, status: string) {
    const existingTask = await projectTaskClient.findFirst({
      where: { id: taskId },
      include: includeProject
    });

    if (!existingTask) {
      return null;
    }

    const task = await projectTaskClient.update({
      where: { id: taskId },
      data: { status },
      include: includeProject
    });

    return mapProjectTask(task);
  },
  async deleteAgentTasksForDocument(projectId: string, documentId: string) {
    await projectTaskClient.deleteMany({
      where: {
        projectId,
        sourceDocumentId: documentId,
        createdByAgent: true
      }
    });
  }
};
