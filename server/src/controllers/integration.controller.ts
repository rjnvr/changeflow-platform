import type { Request, Response } from "express";

import { integrationService } from "../services/integration.service.js";

export const integrationController = {
  async list(_request: Request, response: Response) {
    response.json({
      success: true,
      data: await integrationService.listIntegrations()
    });
  },
  async sync(request: Request, response: Response) {
    const { changeOrderId, provider } = request.body;

    response.json({
      success: true,
      data: await integrationService.syncChangeOrder(changeOrderId, provider)
    });
  }
};
