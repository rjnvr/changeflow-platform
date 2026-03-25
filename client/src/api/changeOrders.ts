import type {
  ChangeOrder,
  ChangeOrderActivityItem,
  ChangeOrderAttachmentUploadIntent,
  ChangeOrderComment
} from "../types/changeOrder";

import { apiRequest } from "./client";

export function getChangeOrders(projectId?: string, options?: { includeArchived?: boolean }) {
  const params = new URLSearchParams();

  if (projectId) {
    params.set("projectId", projectId);
  }

  if (options?.includeArchived) {
    params.set("includeArchived", "true");
  }

  const query = params.toString();

  return apiRequest<ChangeOrder[]>(`/change-orders${query ? `?${query}` : ""}`);
}

export function createChangeOrder(input: {
  projectId: string;
  title: string;
  description: string;
  amount: number;
  requestedBy: string;
  assignedTo: string;
  attachments?: Array<{
    title: string;
    storageKey: string;
    fileName: string;
    contentType: string;
    fileSize: number;
  }>;
}) {
  return apiRequest<ChangeOrder>("/change-orders", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getChangeOrder(changeOrderId: string) {
  return apiRequest<ChangeOrder>(`/change-orders/${changeOrderId}`);
}

export function updateChangeOrder(
  changeOrderId: string,
  input: {
    projectId: string;
    title: string;
    description: string;
    amount: number;
    requestedBy: string;
    assignedTo: string;
  }
) {
  return apiRequest<ChangeOrder>(`/change-orders/${changeOrderId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function getChangeOrderComments(changeOrderId: string) {
  return apiRequest<ChangeOrderComment[]>(`/change-orders/${changeOrderId}/comments`);
}

export function addChangeOrderComment(
  changeOrderId: string,
  input: { authorName: string; body: string }
) {
  return apiRequest<ChangeOrderComment>(`/change-orders/${changeOrderId}/comments`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getChangeOrderActivity(changeOrderId: string) {
  return apiRequest<ChangeOrderActivityItem[]>(`/change-orders/${changeOrderId}/activity`);
}

export function updateChangeOrderStatus(
  changeOrderId: string,
  input: { status: ChangeOrder["status"] }
) {
  return apiRequest<ChangeOrder>(`/change-orders/${changeOrderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function archiveChangeOrder(changeOrderId: string) {
  return apiRequest<ChangeOrder>(`/change-orders/${changeOrderId}/archive`, {
    method: "POST"
  });
}

export function createChangeOrderAttachmentUploadIntent(input: {
  projectId: string;
  fileName: string;
  contentType?: string;
  fileSize: number;
}) {
  return apiRequest<ChangeOrderAttachmentUploadIntent>("/change-orders/upload-intent", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function importChangeOrders(
  changeOrders: Array<{
    projectId: string;
    title: string;
    description: string;
    amount: number;
    requestedBy: string;
  }>
) {
  return apiRequest<ChangeOrder[]>("/change-orders/import", {
    method: "POST",
    body: JSON.stringify({ changeOrders })
  });
}
