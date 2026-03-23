import type { IntegrationConnection } from "../types/integration";

import { apiRequest } from "./client";

export function getIntegrations() {
  return apiRequest<IntegrationConnection[]>("/integrations");
}

export function syncChangeOrder(changeOrderId: string, provider: string) {
  return apiRequest<{ status: string; syncedAt: string }>("/integrations/sync", {
    method: "POST",
    body: JSON.stringify({ changeOrderId, provider })
  });
}

