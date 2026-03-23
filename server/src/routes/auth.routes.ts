import { Router } from "express";

import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema } from "../validators/auth.schemas.js";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.get("/me", authMiddleware, authController.me);

