import { randomUUID } from "node:crypto";

import { prisma } from "../config/db.js";
import type { ProjectAccessRequestRecord } from "../types/domain.js";

type ProjectAccessRequestRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  projectLocation: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  handledById: string | null;
  handledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapProjectAccessRequest(row: ProjectAccessRequestRow): ProjectAccessRequestRecord {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    projectId: row.projectId,
    projectName: row.projectName,
    projectCode: row.projectCode,
    projectLocation: row.projectLocation,
    status: row.status,
    message: row.message ?? undefined,
    handledById: row.handledById ?? undefined,
    handledAt: row.handledAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

async function getDetailedRequestById(requestId: string) {
  const rows = (await prisma.$queryRawUnsafe(
    `
      SELECT
        request."id",
        request."userId",
        CONCAT("user"."firstName", ' ', "user"."lastName") AS "userName",
        "user"."email" AS "userEmail",
        request."projectId",
        project."name" AS "projectName",
        project."code" AS "projectCode",
        project."location" AS "projectLocation",
        request."status",
        request."message",
        request."handledById",
        request."handledAt",
        request."createdAt",
        request."updatedAt"
      FROM "ProjectAccessRequest" request
      INNER JOIN "User" "user" ON "user"."id" = request."userId"
      INNER JOIN "Project" project ON project."id" = request."projectId"
      WHERE request."id" = $1
      LIMIT 1
    `,
    requestId
  )) as ProjectAccessRequestRow[];

  return rows[0] ? mapProjectAccessRequest(rows[0]) : null;
}

export const projectAccessRequestRepository = {
  async listLatestStatusesForUser(userId: string) {
    return (await prisma.$queryRawUnsafe(
      `
        SELECT DISTINCT ON ("projectId")
          "projectId",
          "status"
        FROM "ProjectAccessRequest"
        WHERE "userId" = $1
        ORDER BY "projectId", "createdAt" DESC
      `,
      userId
    )) as Array<{ projectId: string; status: "pending" | "approved" | "rejected" }>;
  },
  async findPendingByUserAndProject(userId: string, projectId: string) {
    const rows = (await prisma.$queryRawUnsafe(
      `
        SELECT "id"
        FROM "ProjectAccessRequest"
        WHERE "userId" = $1
          AND "projectId" = $2
          AND "status" = 'pending'
        ORDER BY "createdAt" DESC
        LIMIT 1
      `,
      userId,
      projectId
    )) as Array<{ id: string }>;

    return rows[0] ? getDetailedRequestById(rows[0].id) : null;
  },
  async create(input: {
    userId: string;
    projectId: string;
    message?: string;
  }) {
    const now = new Date();
    const requestId = randomUUID();

    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "ProjectAccessRequest"
          ("id", "userId", "projectId", "status", "message", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'pending', $4, $5, $5)
      `,
      requestId,
      input.userId,
      input.projectId,
      input.message?.trim() || null,
      now
    );

    return getDetailedRequestById(requestId);
  },
  async listPending() {
    const rows = (await prisma.$queryRawUnsafe(
      `
        SELECT
          request."id",
          request."userId",
          CONCAT("user"."firstName", ' ', "user"."lastName") AS "userName",
          "user"."email" AS "userEmail",
          request."projectId",
          project."name" AS "projectName",
          project."code" AS "projectCode",
          project."location" AS "projectLocation",
          request."status",
          request."message",
          request."handledById",
          request."handledAt",
          request."createdAt",
          request."updatedAt"
        FROM "ProjectAccessRequest" request
        INNER JOIN "User" "user" ON "user"."id" = request."userId"
        INNER JOIN "Project" project ON project."id" = request."projectId"
        WHERE request."status" = 'pending'
        ORDER BY request."createdAt" DESC
      `
    )) as ProjectAccessRequestRow[];

    return rows.map(mapProjectAccessRequest);
  },
  async updateStatus(requestId: string, input: { status: "approved" | "rejected"; handledById: string }) {
    const now = new Date();

    const updatedCount = await prisma.$executeRawUnsafe(
      `
        UPDATE "ProjectAccessRequest"
        SET
          "status" = $2,
          "handledById" = $3,
          "handledAt" = $4,
          "updatedAt" = $4
        WHERE "id" = $1
      `,
      requestId,
      input.status,
      input.handledById,
      now
    );

    if (!updatedCount) {
      return null;
    }

    return getDetailedRequestById(requestId);
  }
};
