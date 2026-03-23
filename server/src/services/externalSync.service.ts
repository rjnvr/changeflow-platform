import { changeOrderService } from "./changeOrder.service.js";
import { auditLogService } from "./auditLog.service.js";

export const externalSyncService = {
  syncChangeOrder(changeOrderId: string, provider: string) {
    const changeOrder = changeOrderService.updateStatus(changeOrderId, "synced");

    auditLogService.record("integration.synced", "change_order", changeOrder.id, {
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
  handleWebhook(payload: Record<string, unknown>) {
    auditLogService.record("integration.webhook_received", "webhook", "external-system", payload);

    return {
      received: true,
      normalizedEvent: {
        provider: payload.provider ?? "unknown",
        eventType: payload.eventType ?? "change_order.updated"
      }
    };
  }
};

