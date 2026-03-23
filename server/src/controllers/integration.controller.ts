import type { Request, Response } from "express";

import { integrationService } from "../services/integration.service.js";

export const integrationController = {
  list(_request: Request, response: Response) {
    response.json({
      success: true,
      data: integrationService.listIntegrations()
    });
  },
  sync(request: Request, response: Response) {
    const { changeOrderId, provider } = request.body;

    response.json({
      success: true,
      data: integrationService.syncChangeOrder(changeOrderId, provider)
    });
  }
};

