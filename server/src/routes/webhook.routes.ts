import { Router } from "express";

import { webhookController } from "../controllers/webhook.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { webhookPayloadSchema } from "../validators/integration.schemas.js";

export const webhookRouter = Router();

webhookRouter.post("/external-system", validate(webhookPayloadSchema), webhookController.receive);

