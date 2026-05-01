import { prisma } from "../config/db.js";
import type { DocumentChunkRecord } from "../types/domain.js";

type DocumentChunkRow = {
  id: string;
  projectId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  embeddingJson: string | null;
  embeddingModel: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const documentChunkClient = (prisma as unknown as {
  documentChunk: {
    findMany(args: unknown): Promise<DocumentChunkRow[]>;
    createMany(args: unknown): Promise<unknown>;
  };
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
}).documentChunk;

function mapDocumentChunk(row: DocumentChunkRow): DocumentChunkRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    documentId: row.documentId,
    chunkIndex: row.chunkIndex,
    content: row.content,
    embedding: row.embeddingJson ? (JSON.parse(row.embeddingJson) as number[]) : undefined,
    embeddingModel: row.embeddingModel ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export const documentChunkRepository = {
  async replaceForDocument(
    projectId: string,
    documentId: string,
    chunks: Array<{ chunkIndex: number; content: string; embedding?: number[]; embeddingModel?: string }>
  ) {
    await (prisma as unknown as { $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown> }).$executeRawUnsafe(
      'DELETE FROM "DocumentChunk" WHERE "documentId" = $1',
      documentId
    );

    if (chunks.length === 0) {
      return;
    }

    await documentChunkClient.createMany({
      data: chunks.map((chunk) => ({
        projectId,
        documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embeddingJson: chunk.embedding ? JSON.stringify(chunk.embedding) : null,
        embeddingModel: chunk.embeddingModel ?? null
      }))
    });
  },
  async listByProject(projectId: string) {
    const rows = await documentChunkClient.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }, { chunkIndex: "asc" }]
    });

    return rows.map(mapDocumentChunk);
  },
  async listByDocument(documentId: string) {
    const rows = await documentChunkClient.findMany({
      where: { documentId },
      orderBy: [{ chunkIndex: "asc" }]
    });

    return rows.map(mapDocumentChunk);
  },
  async updateEmbeddings(
    documentId: string,
    chunks: Array<{ chunkIndex: number; embedding?: number[]; embeddingModel?: string }>
  ) {
    await Promise.all(
      chunks.map((chunk) =>
        (prisma as unknown as {
          $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
        }).$executeRawUnsafe(
          'UPDATE "DocumentChunk" SET "embeddingJson" = $1, "embeddingModel" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE "documentId" = $3 AND "chunkIndex" = $4',
          chunk.embedding ? JSON.stringify(chunk.embedding) : null,
          chunk.embeddingModel ?? null,
          documentId,
          chunk.chunkIndex
        )
      )
    );
  }
};
