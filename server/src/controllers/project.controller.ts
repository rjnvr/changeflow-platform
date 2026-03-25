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
      data: await projectService.listProjects({
        includeArchived: _request.query.includeArchived === "true"
      })
    });
  },
  async get(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.getProject(getRouteParam(request.params.projectId))
    });
  },
  async listTeamMembers(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.listTeamMembers(getRouteParam(request.params.projectId))
    });
  },
  async listTeamDirectory(_request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.listTeamDirectory()
    });
  },
  async addTeamMember(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await projectService.addTeamMember(getRouteParam(request.params.projectId), request.body)
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
      data: await projectService.listDocuments(getRouteParam(request.params.projectId))
    });
  },
  async addDocument(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await projectService.addDocument(getRouteParam(request.params.projectId), request.body)
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
      data: await projectService.createDocumentUploadIntent(getRouteParam(request.params.projectId), request.body)
    });
  },
  async getDocumentDownloadUrl(request: Request, response: Response) {
    response.json({
      success: true,
      data: await projectService.getDocumentDownloadUrl(
        getRouteParam(request.params.projectId),
        getRouteParam(request.params.documentId)
      )
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
