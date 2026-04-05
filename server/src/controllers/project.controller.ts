import type { Request, Response } from "express";

import { projectService } from "../services/project.service.js";

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export const projectController = {
  async list(_request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.listProjects(_request.user!, {
        includeArchived: _request.query.includeArchived === "true"
      })
    });
  },
  async listLocked(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.listLockedProjects(request.user!, {
        includeArchived: request.query.includeArchived === "true"
      })
    });
  },
  async get(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.getProject(request.user!, getRouteParam(request.params.projectId))
    });
  },
  async listTeamMembers(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.listTeamMembers(request.user!, getRouteParam(request.params.projectId))
    });
  },
  async listTeamDirectory(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.listTeamDirectory(request.user!)
    });
  },
  async generateBrief(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.generateProjectBrief(getRouteParam(request.params.projectId), request.user!)
    });
  },
  async addTeamMember(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await projectService.addTeamMember(request.user!, getRouteParam(request.params.projectId), request.body)
    });
  },
  async updateTeamMember(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.updateTeamMember(
        request.user!,
        getRouteParam(request.params.projectId),
        getRouteParam(request.params.teamMemberId),
        request.body
      )
    });
  },
  async removeTeamMember(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.removeTeamMember(
        request.user!,
        getRouteParam(request.params.projectId),
        getRouteParam(request.params.teamMemberId)
      )
    });
  },
  async listDocuments(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.listDocuments(request.user!, getRouteParam(request.params.projectId))
    });
  },
  async addDocument(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await projectService.addDocument(request.user!, getRouteParam(request.params.projectId), request.body)
    });
  },
  async updateDocument(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.updateDocument(
        request.user!,
        getRouteParam(request.params.projectId),
        getRouteParam(request.params.documentId),
        request.body
      )
    });
  },
  async removeDocument(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.removeDocument(
        request.user!,
        getRouteParam(request.params.projectId),
        getRouteParam(request.params.documentId)
      )
    });
  },
  async createDocumentUploadIntent(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await projectService.createDocumentUploadIntent(
        request.user!,
        getRouteParam(request.params.projectId),
        request.body
      )
    });
  },
  async getDocumentDownloadUrl(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.getDocumentDownloadUrl(
        request.user!,
        getRouteParam(request.params.projectId),
        getRouteParam(request.params.documentId)
      )
    });
  },
  async requestAccess(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await projectService.requestProjectAccess(
        request.user!,
        getRouteParam(request.params.projectId),
        request.body
      )
    });
  },
  async listAccessRequests(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.listProjectAccessRequests(request.user!)
    });
  },
  async approveAccessRequest(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.approveProjectAccessRequest(request.user!, getRouteParam(request.params.requestId))
    });
  },
  async rejectAccessRequest(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.rejectProjectAccessRequest(request.user!, getRouteParam(request.params.requestId))
    });
  },
  async bulkUpdateStatus(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.bulkUpdateProjectStatus(request.body)
    });
  },
  async create(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await projectService.createProject(request.body)
    });
  },
  async update(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.updateProject(request.user!, getRouteParam(request.params.projectId), request.body)
    });
  },
  async archive(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.archiveProject(request.user!, getRouteParam(request.params.projectId))
    });
  }
};
