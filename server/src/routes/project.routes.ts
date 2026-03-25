import { Router } from "express";

import { projectController } from "../controllers/project.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  bulkUpdateProjectStatusSchema,
  createProjectDocumentSchema,
  createProjectDocumentUploadIntentSchema,
  createProjectSchema,
  createProjectTeamMemberSchema,
  updateProjectDocumentSchema,
  updateProjectSchema,
  updateProjectTeamMemberSchema
} from "../validators/project.schemas.js";

export const projectRouter = Router();

projectRouter.use(authMiddleware);
projectRouter.get("/", asyncHandler(projectController.list));
projectRouter.get("/team-members", asyncHandler(projectController.listTeamDirectory));
projectRouter.patch(
  "/status",
  validate(bulkUpdateProjectStatusSchema),
  asyncHandler(projectController.bulkUpdateStatus)
);
projectRouter.post("/:projectId/archive", asyncHandler(projectController.archive));
projectRouter.patch("/:projectId", validate(updateProjectSchema), asyncHandler(projectController.update));
projectRouter.get("/:projectId", asyncHandler(projectController.get));
projectRouter.get("/:projectId/team", asyncHandler(projectController.listTeamMembers));
projectRouter.get("/:projectId/documents", asyncHandler(projectController.listDocuments));
projectRouter.get("/:projectId/documents/:documentId/download-url", asyncHandler(projectController.getDocumentDownloadUrl));
projectRouter.post(
  "/:projectId/team",
  validate(createProjectTeamMemberSchema),
  asyncHandler(projectController.addTeamMember)
);
projectRouter.patch(
  "/:projectId/team/:teamMemberId",
  validate(updateProjectTeamMemberSchema),
  asyncHandler(projectController.updateTeamMember)
);
projectRouter.delete("/:projectId/team/:teamMemberId", asyncHandler(projectController.removeTeamMember));
projectRouter.post(
  "/:projectId/documents/upload-intent",
  validate(createProjectDocumentUploadIntentSchema),
  asyncHandler(projectController.createDocumentUploadIntent)
);
projectRouter.post(
  "/:projectId/documents",
  validate(createProjectDocumentSchema),
  asyncHandler(projectController.addDocument)
);
projectRouter.patch(
  "/:projectId/documents/:documentId",
  validate(updateProjectDocumentSchema),
  asyncHandler(projectController.updateDocument)
);
projectRouter.delete("/:projectId/documents/:documentId", asyncHandler(projectController.removeDocument));
projectRouter.post("/", validate(createProjectSchema), asyncHandler(projectController.create));
