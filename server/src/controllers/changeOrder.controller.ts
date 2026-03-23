import type { Request, Response } from "express";

import { changeOrderService } from "../services/changeOrder.service.js";

export const changeOrderController = {
  list(request: Request, response: Response) {
    response.json({
      success: true,
      data: changeOrderService.listChangeOrders(request.query.projectId as string | undefined)
    });
  },
  create(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: changeOrderService.createChangeOrder(request.body)
    });
  },
  updateStatus(request: Request, response: Response) {
    response.json({
      success: true,
      data: changeOrderService.updateStatus(request.params.changeOrderId, request.body.status)
    });
  }
};

