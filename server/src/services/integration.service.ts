import { integrationRepository } from "../repositories/integration.repository.js";
import { externalSyncService } from "./externalSync.service.js";

export const integrationService = {
  async listIntegrations() {
    return integrationRepository.list();
  },
  async syncChangeOrder(changeOrderId: string, provider: string) {
    return externalSyncService.syncChangeOrder(changeOrderId, provider);
  }
};
