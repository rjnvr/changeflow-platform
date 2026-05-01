import { prisma } from "../config/db.js";
import type { AgentMemoryEntryRecord } from "../types/domain.js";

type AgentMemoryEntryRow = {
  id: string;
  projectId: string;
  documentId: string | null;
  runId: string | null;
  kind: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

const agentMemoryEntryClient = (prisma as unknown as {
  agentMemoryEntry: {
    createMany(args: unknown): Promise<{ count: number }>;
    findMany(args: unknown): Promise<AgentMemoryEntryRow[]>;
    deleteMany(args: unknown): Promise<{ count: number }>;
  };
}).agentMemoryEntry;

function mapEntry(entry: AgentMemoryEntryRow): AgentMemoryEntryRecord {
  return {
    id: entry.id,
    projectId: entry.projectId,
    documentId: entry.documentId ?? undefined,
    runId: entry.runId ?? undefined,
    kind: entry.kind,
    title: entry.title,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString()
  };
}

export const agentMemoryEntryRepository = {
  async createMany(
    entries: Array<{
      projectId: string;
      documentId?: string;
      runId?: string;
      kind: string;
      title: string;
      content: string;
    }>
  ) {
    if (entries.length === 0) {
      return;
    }

    await agentMemoryEntryClient.createMany({
      data: entries.map((entry) => ({
        projectId: entry.projectId,
        documentId: entry.documentId,
        runId: entry.runId,
        kind: entry.kind,
        title: entry.title,
        content: entry.content
      }))
    });
  },
  async deleteForDocument(projectId: string, documentId: string) {
    await agentMemoryEntryClient.deleteMany({
      where: {
        projectId,
        documentId
      }
    });
  },
  async listByProject(projectId: string) {
    const entries = await agentMemoryEntryClient.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }]
    });

    return entries.map(mapEntry);
  }
};
