import { Router } from "express";

import { changeOrderController } from "../controllers/changeOrder.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createChangeOrderSchema,
  updateChangeOrderStatusSchema
} from "../validators/changeOrder.schemas.js";

export const changeOrderRouter = Router();

changeOrderRouter.use(authMiddleware);
changeOrderRouter.get("/", changeOrderController.list);
changeOrderRouter.post("/", validate(createChangeOrderSchema), changeOrderController.create);
changeOrderRouter.patch(
  "/:changeOrderId/status",
  validate(updateChangeOrderStatusSchema),
  changeOrderController.updateStatus
);

