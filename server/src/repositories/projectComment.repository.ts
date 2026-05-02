import { prisma } from "../config/db.js";
import type { ProjectCommentRecord } from "../types/domain.js";

type ProjectCommentRow = {
  id: string;
  projectId: string;
  sourceDocumentId: string | null;
  authorName: string;
  body: string;
  createdByAgent: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const projectCommentClient = (prisma as unknown as {
  projectComment?: {
    findMany(args: unknown): Promise<ProjectCommentRow[]>;
    create(args: unknown): Promise<ProjectCommentRow>;
    deleteMany(args: unknown): Promise<{ count: number }>;
  };
}).projectComment;

function mapProjectComment(comment: ProjectCommentRow): ProjectCommentRecord {
  return {
    id: comment.id,
    projectId: comment.projectId,
    sourceDocumentId: comment.sourceDocumentId ?? undefined,
    authorName: comment.authorName,
    body: comment.body,
    createdByAgent: comment.createdByAgent,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString()
  };
}

export const projectCommentRepository = {
  async listByProject(projectId: string) {
    if (!projectCommentClient) {
      return [];
    }

    const comments = await projectCommentClient.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }]
    });

    return comments.map(mapProjectComment);
  },
  async create(input: Omit<ProjectCommentRecord, "id" | "createdAt" | "updatedAt">) {
    if (!projectCommentClient) {
      return null;
    }

    const comment = await projectCommentClient.create({
      data: {
        projectId: input.projectId,
        sourceDocumentId: input.sourceDocumentId,
        authorName: input.authorName,
        body: input.body,
        createdByAgent: input.createdByAgent
      }
    });

    return mapProjectComment(comment);
  },
  async deleteAgentCommentsForDocument(projectId: string, documentId: string) {
    if (!projectCommentClient) {
      return;
    }

    await projectCommentClient.deleteMany({
      where: {
        projectId,
        sourceDocumentId: documentId,
        createdByAgent: true
      }
    });
  }
};
