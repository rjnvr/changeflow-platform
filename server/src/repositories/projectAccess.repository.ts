import { randomUUID } from "node:crypto";

import { prisma } from "../config/db.js";

export const projectAccessRepository = {
  async listGrantedProjectIdsForUser(userId: string) {
    const rows = (await prisma.$queryRawUnsafe(
      `
        SELECT "projectId"
        FROM "ProjectAccess"
        WHERE "userId" = $1
      `,
      userId
    )) as Array<{ projectId: string }>;

    return rows.map((row: { projectId: string }) => row.projectId);
  },
  async grantAccess(input: { userId: string; projectId: string; grantedById?: string }) {
    const now = new Date();

    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "ProjectAccess" ("id", "userId", "projectId", "grantedById", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $5)
        ON CONFLICT ("userId", "projectId")
        DO UPDATE SET
          "grantedById" = EXCLUDED."grantedById",
          "updatedAt" = EXCLUDED."updatedAt"
      `,
      randomUUID(),
      input.userId,
      input.projectId,
      input.grantedById ?? null,
      now
    );
  }
};
