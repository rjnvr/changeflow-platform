import crypto from "node:crypto";

import type { AuditLogRecord } from "../types/domain.js";

const auditLogs: AuditLogRecord[] = [];

export const auditLogRepository = {
  list() {
    return auditLogs;
  },
  create(log: Omit<AuditLogRecord, "id" | "createdAt">) {
    const newLog: AuditLogRecord = {
      id: `audit_${crypto.randomUUID().slice(0, 8)}`,
      ...log,
      createdAt: new Date().toISOString()
    };

    auditLogs.unshift(newLog);
    return newLog;
  }
};

