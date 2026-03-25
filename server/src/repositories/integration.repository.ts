import { prisma } from "../config/db.js";
import type { IntegrationConnectionRecord } from "../types/domain.js";

function mapIntegration(connection: {
  id: string;
  provider: string;
  status: IntegrationConnectionRecord["status"];
  lastSyncedAt: Date | null;
}): IntegrationConnectionRecord {
  return {
    id: connection.id,
    provider: connection.provider,
    status: connection.status,
    lastSyncedAt: connection.lastSyncedAt?.toISOString()
  };
}

export const integrationRepository = {
  async list() {
    const integrations = await prisma.integrationConnection.findMany({
      orderBy: [{ updatedAt: "desc" }, { provider: "asc" }]
    });

    return integrations.map(mapIntegration);
  },
  async upsertStatus(provider: string, status: IntegrationConnectionRecord["status"], markSynced = false) {
    const integration = await prisma.integrationConnection.upsert({
      where: { provider },
      update: {
        status,
        lastSyncedAt: markSynced ? new Date() : undefined
      },
      create: {
        provider,
        status,
        lastSyncedAt: markSynced ? new Date() : undefined
      }
    });

    return mapIntegration(integration);
  }
};
