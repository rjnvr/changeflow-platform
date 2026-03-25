import { Router } from "express";

import { integrationController } from "../controllers/integration.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { syncChangeOrderSchema } from "../validators/integration.schemas.js";

export const integrationRouter = Router();

integrationRouter.use(authMiddleware);
integrationRouter.get("/", asyncHandler(integrationController.list));
integrationRouter.post("/sync", validate(syncChangeOrderSchema), asyncHandler(integrationController.sync));
