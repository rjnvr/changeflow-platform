import { prisma } from "../config/db.js";
import type { ProjectDocumentRecord } from "../types/domain.js";

const projectDocumentClient = (prisma as unknown as {
  projectDocument: {
    findMany(args: unknown): Promise<
      Array<{
        id: string;
        projectId: string;
        title: string;
        kind: string;
        summary: string;
        url: string | null;
        storageKey: string | null;
        fileName: string | null;
        contentType: string | null;
        fileSize: number | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >;
    create(args: unknown): Promise<{
      id: string;
      projectId: string;
      title: string;
      kind: string;
      summary: string;
      url: string | null;
      storageKey: string | null;
      fileName: string | null;
      contentType: string | null;
      fileSize: number | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    findFirst(args: unknown): Promise<{
      id: string;
      projectId: string;
      title: string;
      kind: string;
      summary: string;
      url: string | null;
      storageKey: string | null;
      fileName: string | null;
      contentType: string | null;
      fileSize: number | null;
      createdAt: Date;
      updatedAt: Date;
    } | null>;
    update(args: unknown): Promise<{
      id: string;
      projectId: string;
      title: string;
      kind: string;
      summary: string;
      url: string | null;
      storageKey: string | null;
      fileName: string | null;
      contentType: string | null;
      fileSize: number | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    delete(args: unknown): Promise<{
      id: string;
      projectId: string;
      title: string;
      kind: string;
      summary: string;
      url: string | null;
      storageKey: string | null;
      fileName: string | null;
      contentType: string | null;
      fileSize: number | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
}).projectDocument;

function mapProjectDocument(document: {
  id: string;
  projectId: string;
  title: string;
  kind: string;
  summary: string;
  url: string | null;
  storageKey: string | null;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  createdAt: Date;
  updatedAt: Date;
}): ProjectDocumentRecord {
  return {
    id: document.id,
    projectId: document.projectId,
    title: document.title,
    kind: document.kind,
    summary: document.summary,
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
