import type { ChangeOrder } from "../types/changeOrder";

import { apiRequest } from "./client";

export function getChangeOrders(projectId?: string) {
  const query = projectId ? `?projectId=${projectId}` : "";
  return apiRequest<ChangeOrder[]>(`/change-orders${query}`);
}

export function createChangeOrder(input: {
  projectId: string;
  title: string;
  description: string;
  amount: number;
  requestedBy: string;
}) {
  return apiRequest<ChangeOrder>("/change-orders", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
