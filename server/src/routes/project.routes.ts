import { Router } from "express";

import { projectController } from "../controllers/project.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  bulkUpdateProjectStatusSchema,
  askProjectQuestionSchema,
  createProjectAccessRequestSchema,
  createProjectDocumentSchema,
  createProjectDocumentUploadIntentSchema,
  createProjectSchema,
  createProjectTeamMemberSchema,
  updateProjectDocumentSchema,
  updateProjectRiskFlagStatusSchema,
  updateProjectSchema,
  updateProjectTaskStatusSchema,
  updateProjectTeamMemberSchema
} from "../validators/project.schemas.js";

export const projectRouter = Router();

projectRouter.use(authMiddleware);
projectRouter.get("/", asyncHandler(projectController.list));
projectRouter.get("/locked", asyncHandler(projectController.listLocked));
projectRouter.get("/access-requests", asyncHandler(projectController.listAccessRequests));
projectRouter.get("/team-members", asyncHandler(projectController.listTeamDirectory));
projectRouter.get("/tasks", asyncHandler(projectController.listTasks));
projectRouter.get("/risk-flags", asyncHandler(projectController.listRiskFlags));
projectRouter.patch(
  "/status",
  validate(bulkUpdateProjectStatusSchema),
  asyncHandler(projectController.bulkUpdateStatus)
);
projectRouter.patch(
  "/tasks/:taskId/status",
  validate(updateProjectTaskStatusSchema),
  asyncHandler(projectController.updateTaskStatus)
);
projectRouter.patch(
  "/risk-flags/:riskFlagId/status",
  validate(updateProjectRiskFlagStatusSchema),
  asyncHandler(projectController.updateRiskFlagStatus)
);
projectRouter.post("/:projectId/brief", asyncHandler(projectController.generateBrief));
projectRouter.post("/:projectId/archive", asyncHandler(projectController.archive));
projectRouter.post(
  "/:projectId/access-requests",
  validate(createProjectAccessRequestSchema),
  asyncHandler(projectController.requestAccess)
);
projectRouter.patch("/:projectId", validate(updateProjectSchema), asyncHandler(projectController.update));
projectRouter.post(
  "/access-requests/:requestId/approve",
  asyncHandler(projectController.approveAccessRequest)
);
projectRouter.post(
  "/access-requests/:requestId/reject",
  asyncHandler(projectController.rejectAccessRequest)
);
projectRouter.get("/:projectId", asyncHandler(projectController.get));
projectRouter.get("/:projectId/team", asyncHandler(projectController.listTeamMembers));
projectRouter.get("/:projectId/documents", asyncHandler(projectController.listDocuments));
projectRouter.get("/:projectId/agent-workspace", asyncHandler(projectController.getAgentWorkspace));
projectRouter.post("/:projectId/questions", validate(askProjectQuestionSchema), asyncHandler(projectController.askQuestion));
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
