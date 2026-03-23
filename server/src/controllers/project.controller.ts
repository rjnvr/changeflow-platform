import type { Request, Response } from "express";

import { projectService } from "../services/project.service.js";

export const projectController = {
  list(request: Request, response: Response) {
    response.json({
      success: true,
      data: projectService.listProjects()
    });
  },
  get(request: Request, response: Response) {
    response.json({
      success: true,
      data: projectService.getProject(request.params.projectId)
    });
  },
  create(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: projectService.createProject(request.body)
    });
  }
};

