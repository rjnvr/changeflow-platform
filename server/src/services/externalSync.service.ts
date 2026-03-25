import { changeOrderService } from "./changeOrder.service.js";
import { auditLogService } from "./auditLog.service.js";
import { integrationRepository } from "../repositories/integration.repository.js";

export const externalSyncService = {
  async syncChangeOrder(changeOrderId: string, provider: string) {
    const changeOrder = await changeOrderService.updateStatus(
      {
        id: "system",
        email: "system@changeflow.local",
        role: "admin"
      },
      changeOrderId,
      "synced"
    );

    await integrationRepository.upsertStatus(provider, "connected", true);

    await auditLogService.record("integration.synced", "change_order", changeOrder.id, {
      provider,
      externalReference: changeOrder.externalReference ?? null
    });

    return {
      changeOrderId,
      provider,
      syncedAt: new Date().toISOString(),
      status: "success"
    };
  },
  async handleWebhook(payload: Record<string, unknown>) {
    await auditLogService.record("integration.webhook_received", "webhook", "external-system", payload);

    return {
      received: true,
      normalizedEvent: {
        provider: payload.provider ?? "unknown",
        eventType: payload.eventType ?? "change_order.updated"
      }
    };
  }
};
