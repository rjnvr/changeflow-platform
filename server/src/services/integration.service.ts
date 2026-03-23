import type { IntegrationConnectionRecord } from "../types/domain.js";
import { externalSyncService } from "./externalSync.service.js";

const integrations: IntegrationConnectionRecord[] = [
  {
    id: "int_1",
    provider: "Slack",
    status: "connected",
    lastSyncedAt: new Date().toISOString()
  },
  {
    id: "int_2",
    provider: "Procore",
    status: "connected",
    lastSyncedAt: new Date().toISOString()
  },
  {
    id: "int_3",
    provider: "QuickBooks",
    status: "disconnected"
  }
];

export const integrationService = {
  listIntegrations() {
    return integrations;
  },
  syncChangeOrder(changeOrderId: string, provider: string) {
    return externalSyncService.syncChangeOrder(changeOrderId, provider);
  }
};

