import { auditLogRepository } from "../repositories/auditLog.repository.js";

export const auditLogService = {
  async record(action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>) {
    return auditLogRepository.create({
      action,
      entityType,
      entityId,
      metadata
    });
  },
  async list() {
    return auditLogRepository.list();
  },
  async listByEntity(entityType: string, entityId: string) {
    return auditLogRepository.listByEntity(entityType, entityId);
  }
};
