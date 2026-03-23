import { Router } from "express";

import { projectController } from "../controllers/project.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createProjectSchema } from "../validators/project.schemas.js";

export const projectRouter = Router();

projectRouter.use(authMiddleware);
projectRouter.get("/", projectController.list);
projectRouter.get("/:projectId", projectController.get);
projectRouter.post("/", validate(createProjectSchema), projectController.create);

