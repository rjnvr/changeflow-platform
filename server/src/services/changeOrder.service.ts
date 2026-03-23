import { changeOrderRepository } from "../repositories/changeOrder.repository.js";
import { ApiError } from "../utils/apiError.js";
import { aiSummaryService } from "./aiSummary.service.js";
import { auditLogService } from "./auditLog.service.js";

export const changeOrderService = {
  listChangeOrders(projectId?: string) {
    return changeOrderRepository.list(projectId);
  },
  getChangeOrder(changeOrderId: string) {
    const changeOrder = changeOrderRepository.findById(changeOrderId);

    if (!changeOrder) {
      throw new ApiError(404, "Change order not found.");
    }

    return changeOrder;
  },
  createChangeOrder(input: {
    projectId: string;
    title: string;
    description: string;
    amount: number;
    requestedBy: string;
  }) {
    const changeOrder = changeOrderRepository.create({
      ...input,
      status: "draft",
      aiSummary: aiSummaryService.generateSummary(input.description, input.amount)
    });

    auditLogService.record("change_order.created", "change_order", changeOrder.id, {
      projectId: changeOrder.projectId,
      amount: changeOrder.amount
    });

    return changeOrder;
  },
  updateStatus(changeOrderId: string, status: "draft" | "pending_review" | "approved" | "rejected" | "synced") {
    const changeOrder = changeOrderRepository.updateStatus(changeOrderId, status);

    if (!changeOrder) {
      throw new ApiError(404, "Change order not found.");
    }

    auditLogService.record("change_order.status_updated", "change_order", changeOrder.id, {
      status: changeOrder.status
    });

    return changeOrder;
  }
};

