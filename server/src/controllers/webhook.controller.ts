import type { Request, Response } from "express";

import { externalSyncService } from "../services/externalSync.service.js";

export const webhookController = {
  async receive(request: Request, response: Response) {
    response.status(202).json({
      success: true,
      data: await externalSyncService.handleWebhook(request.body)
    });
  }
};
