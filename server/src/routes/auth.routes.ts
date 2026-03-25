import { Router } from "express";

import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
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
authRouter.post(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);
