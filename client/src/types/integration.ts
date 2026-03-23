export interface IntegrationConnection {
  id: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  lastSyncedAt?: string;
}

