import { Router } from "express";

import { changeOrderController } from "../controllers/changeOrder.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createChangeOrderAttachmentUploadIntentSchema,
  createChangeOrderCommentSchema,
  createChangeOrderSchema,
  importChangeOrdersSchema,
  updateChangeOrderSchema,
  updateChangeOrderStatusSchema
} from "../validators/changeOrder.schemas.js";

export const changeOrderRouter = Router();

changeOrderRouter.use(authMiddleware);
changeOrderRouter.get("/", asyncHandler(changeOrderController.list));
changeOrderRouter.post(
  "/upload-intent",
  validate(createChangeOrderAttachmentUploadIntentSchema),
  asyncHandler(changeOrderController.createAttachmentUploadIntent)
);
changeOrderRouter.post("/import", validate(importChangeOrdersSchema), asyncHandler(changeOrderController.import));
changeOrderRouter.post("/", validate(createChangeOrderSchema), asyncHandler(changeOrderController.create));
changeOrderRouter.get("/:changeOrderId", asyncHandler(changeOrderController.get));
changeOrderRouter.post("/:changeOrderId/archive", asyncHandler(changeOrderController.archive));
changeOrderRouter.patch(
  "/:changeOrderId",
  validate(updateChangeOrderSchema),
  asyncHandler(changeOrderController.update)
);
changeOrderRouter.get("/:changeOrderId/comments", asyncHandler(changeOrderController.listComments));
changeOrderRouter.post(
  "/:changeOrderId/comments",
  validate(createChangeOrderCommentSchema),
  asyncHandler(changeOrderController.addComment)
);
changeOrderRouter.get("/:changeOrderId/activity", asyncHandler(changeOrderController.listActivity));
changeOrderRouter.patch(
  "/:changeOrderId/status",
  validate(updateChangeOrderStatusSchema),
  asyncHandler(changeOrderController.updateStatus)
);
