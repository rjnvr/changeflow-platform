import { auditLogRepository } from "../repositories/auditLog.repository.js";

export const auditLogService = {
  record(action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>) {
    return auditLogRepository.create({
      action,
      entityType,
      entityId,
      metadata
    });
  },
  list() {
    return auditLogRepository.list();
  }
};

