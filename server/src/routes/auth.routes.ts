import { Router } from "express";

import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  applyBriefQuotaToAllSchema,
  changePasswordSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  updateBriefQuotaSchema,
  updateProfileSchema
} from "../validators/auth.schemas.js";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), asyncHandler(authController.login));
authRouter.post("/register", validate(registerSchema), asyncHandler(authController.register));
authRouter.post(
  "/request-password-reset",
  validate(requestPasswordResetSchema),
  asyncHandler(authController.requestPasswordReset)
);
authRouter.post("/reset-password", validate(resetPasswordSchema), asyncHandler(authController.resetPassword));
authRouter.get("/me", authMiddleware, asyncHandler(authController.me));
authRouter.patch("/me", authMiddleware, validate(updateProfileSchema), asyncHandler(authController.updateProfile));
authRouter.get("/brief-quotas", authMiddleware, asyncHandler(authController.listBriefQuotas));
authRouter.patch(
  "/brief-quotas/apply-to-all",
  authMiddleware,
  validate(applyBriefQuotaToAllSchema),
  asyncHandler(authController.applyBriefQuotaToAll)
);
authRouter.patch(
  "/users/:userId/brief-quota",
  authMiddleware,
  validate(updateBriefQuotaSchema),
  asyncHandler(authController.updateBriefQuota)
);
authRouter.post(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);
