import { prisma } from "../config/db.js";
import type { DocumentProcessingRunRecord } from "../types/domain.js";

type DocumentProcessingRunRow = {
  id: string;
  projectId: string;
  documentId: string;
  status: string;
  extractionMethod: string;
  extractedTextChars: number | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const documentProcessingRunClient = (prisma as unknown as {
  documentProcessingRun: {
    findMany(args: unknown): Promise<DocumentProcessingRunRow[]>;
    create(args: unknown): Promise<DocumentProcessingRunRow>;
    update(args: unknown): Promise<DocumentProcessingRunRow>;
  };
}).documentProcessingRun;

function mapDocumentProcessingRun(run: DocumentProcessingRunRow): DocumentProcessingRunRecord {
  return {
    id: run.id,
    projectId: run.projectId,
    documentId: run.documentId,
    status: run.status,
    extractionMethod: run.extractionMethod,
    extractedTextChars: run.extractedTextChars ?? undefined,
    errorMessage: run.errorMessage ?? undefined,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString()
  };
}

export const documentProcessingRunRepository = {
  async listByProject(projectId: string) {
    const runs = await documentProcessingRunClient.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }]
    });

    return runs.map(mapDocumentProcessingRun);
  },
  async create(input: Omit<DocumentProcessingRunRecord, "id" | "createdAt" | "updatedAt">) {
    const run = await documentProcessingRunClient.create({
      data: {
        projectId: input.projectId,
        documentId: input.documentId,
        status: input.status,
        extractionMethod: input.extractionMethod,
        extractedTextChars: input.extractedTextChars,
        errorMessage: input.errorMessage
      }
    });

    return mapDocumentProcessingRun(run);
  },
  async update(
    runId: string,
    input: Partial<Pick<DocumentProcessingRunRecord, "status" | "extractionMethod" | "extractedTextChars" | "errorMessage">>
  ) {
    const run = await documentProcessingRunClient.update({
      where: { id: runId },
      data: {
        status: input.status,
        extractionMethod: input.extractionMethod,
        extractedTextChars: input.extractedTextChars,
        errorMessage: input.errorMessage
      }
    });

    return mapDocumentProcessingRun(run);
  }
};
