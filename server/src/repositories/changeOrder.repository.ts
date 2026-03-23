import crypto from "node:crypto";

import type { ChangeOrderRecord } from "../types/domain.js";

const changeOrders: ChangeOrderRecord[] = [
  {
    id: "co_1001",
    projectId: "prj_h26_001",
    title: "Lobby finish upgrade",
    description: "Upgrade lobby stone finish to owner-requested premium option.",
    status: "pending_review",
    amount: 28500,
    requestedBy: "Demo User",
    externalReference: "PROCORE-4832",
    aiSummary: "Owner requested a premium finish upgrade that increases material costs and schedule coordination.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const changeOrderRepository = {
  list(projectId?: string) {
    if (!projectId) {
      return changeOrders;
    }

    return changeOrders.filter((changeOrder) => changeOrder.projectId === projectId);
  },
  findById(changeOrderId: string) {
    return changeOrders.find((changeOrder) => changeOrder.id === changeOrderId) ?? null;
  },
  create(changeOrder: Omit<ChangeOrderRecord, "id" | "createdAt" | "updatedAt">) {
    const newChangeOrder: ChangeOrderRecord = {
      id: `co_${crypto.randomUUID().slice(0, 8)}`,
      ...changeOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    changeOrders.unshift(newChangeOrder);
    return newChangeOrder;
  },
  updateStatus(changeOrderId: string, status: ChangeOrderRecord["status"]) {
    const changeOrder = changeOrders.find((record) => record.id === changeOrderId);

    if (!changeOrder) {
      return null;
    }

    changeOrder.status = status;
    changeOrder.updatedAt = new Date().toISOString();
    return changeOrder;
  }
};

