import type { Request, Response } from "express";

import { changeOrderService } from "../services/changeOrder.service.js";

function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export const changeOrderController = {
  async list(request: Request, response: Response) {
    response.json({
      success: true,
      data: await changeOrderService.listChangeOrders(request.user!, request.query.projectId as string | undefined, {
        includeArchived: request.query.includeArchived === "true"
      })
    });
  },
  async create(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await changeOrderService.createChangeOrder(request.user!, request.body)
    });
  },
  async get(request: Request, response: Response) {
    response.json({
      success: true,
      data: await changeOrderService.getChangeOrder(request.user!, getRouteParam(request.params.changeOrderId))
    });
  },
  async update(request: Request, response: Response) {
    response.json({
      success: true,
      data: await changeOrderService.updateChangeOrder(request.user!, getRouteParam(request.params.changeOrderId), request.body)
    });
  },
  async archive(request: Request, response: Response) {
    response.json({
      success: true,
      data: await changeOrderService.archiveChangeOrder(request.user!, getRouteParam(request.params.changeOrderId))
    });
  },
  async listComments(request: Request, response: Response) {
    response.json({
      success: true,
      data: await changeOrderService.listComments(request.user!, getRouteParam(request.params.changeOrderId))
    });
  },
  async addComment(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await changeOrderService.addComment(request.user!, getRouteParam(request.params.changeOrderId), request.body)
    });
  },
  async listActivity(request: Request, response: Response) {
    response.json({
      success: true,
      data: await changeOrderService.listActivity(request.user!, getRouteParam(request.params.changeOrderId))
    });
  },
  async createAttachmentUploadIntent(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await changeOrderService.createAttachmentUploadIntent(request.user!, request.body)
    });
  },
  async addAttachments(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await changeOrderService.addAttachments(
        request.user!,
        getRouteParam(request.params.changeOrderId),
        request.body
      )
    });
  },
  async getAttachmentDownloadUrl(request: Request, response: Response) {
    response.json({
      success: true,
      data: await changeOrderService.getAttachmentDownloadUrl(
        request.user!,
        getRouteParam(request.params.changeOrderId),
        getRouteParam(request.params.attachmentId)
      )
    });
  },
  async removeAttachment(request: Request, response: Response) {
    response.json({
      success: true,
      data: await changeOrderService.removeAttachment(
        request.user!,
        getRouteParam(request.params.changeOrderId),
        getRouteParam(request.params.attachmentId)
      )
    });
  },
  async import(request: Request, response: Response) {
    response.status(201).json({
      success: true,
      data: await changeOrderService.importChangeOrders(request.user!, request.body.changeOrders)
    });
  },
  async updateStatus(request: Request, response: Response) {
    response.json({
      success: true,
      data: await changeOrderService.updateStatus(
        request.user!,
        getRouteParam(request.params.changeOrderId),
        request.body.status
      )
    });
  }
};
