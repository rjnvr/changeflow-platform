import { prisma } from "../config/db.js";
import type { ChangeOrderCommentRecord } from "../types/domain.js";

function mapChangeOrderComment(comment: {
  id: string;
  changeOrderId: string;
  authorName: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}): ChangeOrderCommentRecord {
  return {
    id: comment.id,
    changeOrderId: comment.changeOrderId,
    authorName: comment.authorName,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString()
  };
}

export const changeOrderCommentRepository = {
  async listByChangeOrder(changeOrderId: string) {
    const comments = await prisma.changeOrderComment.findMany({
      where: { changeOrderId },
      orderBy: [{ createdAt: "asc" }]
    });

    return comments.map(mapChangeOrderComment);
  },
  async create(input: Omit<ChangeOrderCommentRecord, "id" | "createdAt" | "updatedAt">) {
    const createdComment = await prisma.changeOrderComment.create({
      data: {
        changeOrderId: input.changeOrderId,
        authorName: input.authorName,
        body: input.body
      }
    });

    return mapChangeOrderComment(createdComment);
  }
};
