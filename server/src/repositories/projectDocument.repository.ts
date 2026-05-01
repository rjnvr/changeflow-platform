import { prisma } from "../config/db.js";
import type { ProjectDocumentRecord } from "../types/domain.js";

type ProjectDocumentRow = {
  id: string;
  projectId: string;
  title: string;
  kind: string;
  summary: string;
  aiSummary: string | null;
  agentStatus: string;
  processingError: string | null;
  lastProcessedAt: Date | null;
  assignedTo: string | null;
  url: string | null;
  storageKey: string | null;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  createdAt: Date;
  updatedAt: Date;
};

const projectDocumentClient = (prisma as unknown as {
  projectDocument: {
    findMany(args: unknown): Promise<ProjectDocumentRow[]>;
    create(args: unknown): Promise<ProjectDocumentRow>;
    findFirst(args: unknown): Promise<ProjectDocumentRow | null>;
    update(args: unknown): Promise<ProjectDocumentRow>;
    delete(args: unknown): Promise<ProjectDocumentRow>;
  };
}).projectDocument;

function mapProjectDocument(document: ProjectDocumentRow): ProjectDocumentRecord {
  return {
    id: document.id,
    projectId: document.projectId,
    title: document.title,
    kind: document.kind,
    summary: document.summary,
    aiSummary: document.aiSummary ?? undefined,
    agentStatus: document.agentStatus,
    processingError: document.processingError ?? undefined,
    lastProcessedAt: document.lastProcessedAt?.toISOString(),
    assignedTo: document.assignedTo ?? undefined,
    url: document.url ?? undefined,
    storageKey: document.storageKey ?? undefined,
    fileName: document.fileName ?? undefined,
    contentType: document.contentType ?? undefined,
    fileSize: document.fileSize ?? undefined,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export const projectDocumentRepository = {
  async listByProject(projectId: string) {
    const documents = await projectDocumentClient.findMany({
      where: { projectId },
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }]
    });

    return documents.map(mapProjectDocument);
  },
  async findById(projectId: string, documentId: string) {
    const document = await projectDocumentClient.findFirst({
      where: {
        id: documentId,
        projectId
      }
    });

    return document ? mapProjectDocument(document) : null;
  },
  async create(input: Omit<ProjectDocumentRecord, "id" | "createdAt" | "updatedAt">) {
    const createdDocument = await projectDocumentClient.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        kind: input.kind,
        summary: input.summary,
        aiSummary: input.aiSummary,
        agentStatus: input.agentStatus,
        processingError: input.processingError,
        lastProcessedAt: input.lastProcessedAt ? new Date(input.lastProcessedAt) : undefined,
        assignedTo: input.assignedTo,
        url: input.url,
        storageKey: input.storageKey,
        fileName: input.fileName,
        contentType: input.contentType,
        fileSize: input.fileSize
      }
    });

    return mapProjectDocument(createdDocument);
  },
  async update(
    projectId: string,
    documentId: string,
    input: {
      title: string;
      kind: string;
      summary: string;
      aiSummary?: string;
      agentStatus?: string;
      processingError?: string;
      lastProcessedAt?: string;
      assignedTo?: string;
      url?: string;
    }
  ) {
    const existingDocument = await projectDocumentClient.findFirst({
      where: {
        id: documentId,
        projectId
      }
    });

    if (!existingDocument) {
      return null;
    }

    const updatedDocument = await projectDocumentClient.update({
      where: { id: documentId },
      data: {
        title: input.title,
        kind: input.kind,
        summary: input.summary,
        aiSummary: input.aiSummary ?? existingDocument.aiSummary,
        agentStatus: input.agentStatus ?? existingDocument.agentStatus,
        processingError:
          input.processingError === undefined ? existingDocument.processingError : input.processingError,
        lastProcessedAt: input.lastProcessedAt
          ? new Date(input.lastProcessedAt)
          : existingDocument.lastProcessedAt,
        assignedTo: input.assignedTo ?? null,
        url: existingDocument.storageKey ? existingDocument.url : input.url ?? null
      }
    });

    return mapProjectDocument(updatedDocument);
  },
  async delete(projectId: string, documentId: string) {
    const existingDocument = await projectDocumentClient.findFirst({
      where: {
        id: documentId,
        projectId
      }
    });

    if (!existingDocument) {
      return null;
    }

    const deletedDocument = await projectDocumentClient.delete({
      where: { id: documentId }
    });

    return mapProjectDocument(deletedDocument);
  }
};
