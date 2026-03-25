import { Prisma } from "@prisma/client";

import { prisma } from "../config/db.js";
import type { AuditLogRecord } from "../types/domain.js";

function mapAuditLog(log: {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): AuditLogRecord {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: (log.metadata as Record<string, unknown> | null) ?? undefined,
    createdAt: log.createdAt.toISOString()
  };
}

export const auditLogRepository = {
  async list() {
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" }
    });

    return auditLogs.map(mapAuditLog);
  },
  async listByEntity(entityType: string, entityId: string) {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId
      },
      orderBy: { createdAt: "desc" }
    });

    return auditLogs.map(mapAuditLog);
  },
  async create(log: Omit<AuditLogRecord, "id" | "createdAt">) {
    const createdLog = await prisma.auditLog.create({
      data: {
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata ? (log.metadata as Prisma.InputJsonValue) : undefined
      }
    });

    return mapAuditLog(createdLog);
  }
};
