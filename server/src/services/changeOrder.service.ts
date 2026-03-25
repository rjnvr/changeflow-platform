import { changeOrderRepository } from "../repositories/changeOrder.repository.js";
import { changeOrderCommentRepository } from "../repositories/changeOrderComment.repository.js";
import { projectRepository } from "../repositories/project.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import type { AuthenticatedUser } from "../types/domain.js";
import { ApiError } from "../utils/apiError.js";
import { aiSummaryService } from "./aiSummary.service.js";
import { auditLogService } from "./auditLog.service.js";
import { emailService } from "./email.service.js";
import { storageService } from "./storage.service.js";

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function resolveChangeOrderRecipients(input: {
  projectOwnerId: string;
  assignedTo?: string;
  requestedBy: string;
}) {
  const recipients = new Map<string, { email: string; firstName?: string }>();
  const owner = await userRepository.findById(input.projectOwnerId);

  if (owner) {
    recipients.set(owner.email.toLowerCase(), {
      email: owner.email,
      firstName: owner.firstName
    });
  }

  const assigneeLookup = input.assignedTo?.trim();

  if (assigneeLookup) {
    const matchedAssignee = await userRepository.findByNameOrEmail(assigneeLookup);

    if (matchedAssignee) {
      recipients.set(matchedAssignee.email.toLowerCase(), {
        email: matchedAssignee.email,
        firstName: matchedAssignee.firstName
      });
    } else if (looksLikeEmail(assigneeLookup)) {
      recipients.set(assigneeLookup.toLowerCase(), {
        email: assigneeLookup
      });
    }
  }

  const requesterLookup = input.requestedBy.trim();

  if (requesterLookup) {
    const matchedRequester = await userRepository.findByNameOrEmail(requesterLookup);

    if (matchedRequester) {
      recipients.set(matchedRequester.email.toLowerCase(), {
        email: matchedRequester.email,
        firstName: matchedRequester.firstName
      });
    } else if (looksLikeEmail(requesterLookup)) {
      recipients.set(requesterLookup.toLowerCase(), {
        email: requesterLookup
      });
    }
  }

  return [...recipients.values()];
}

function canEditProject(user: AuthenticatedUser, ownerId: string) {
  return user.role === "admin" || user.id === ownerId;
}

export const changeOrderService = {
  async listChangeOrders(projectId?: string, options?: { includeArchived?: boolean }) {
    return changeOrderRepository.list(projectId, options);
  },
  async getChangeOrder(changeOrderId: string) {
    const changeOrder = await changeOrderRepository.findById(changeOrderId);

    if (!changeOrder) {
      throw new ApiError(404, "Change order not found.");
    }

    return changeOrder;
  },
  async listComments(changeOrderId: string) {
    await this.getChangeOrder(changeOrderId);
    return changeOrderCommentRepository.listByChangeOrder(changeOrderId);
  },
  async addComment(changeOrderId: string, input: { authorName: string; body: string }) {
    const changeOrder = await this.getChangeOrder(changeOrderId);
    const project = await projectRepository.findById(changeOrder.projectId);

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    if (project.archivedAt || changeOrder.archivedAt) {
      throw new ApiError(400, "Archived change orders are read-only.");
    }

    const comment = await changeOrderCommentRepository.create({
      changeOrderId,
      authorName: input.authorName,
      body: input.body
    });

    await auditLogService.record("change_order.comment_added", "change_order", changeOrderId, {
      authorName: comment.authorName
    });

    return comment;
  },
  async listActivity(changeOrderId: string) {
    await this.getChangeOrder(changeOrderId);
    return auditLogService.listByEntity("change_order", changeOrderId);
  },
  async createChangeOrder(input: {
    projectId: string;
    title: string;
    description: string;
    amount: number;
    requestedBy: string;
    assignedTo: string;
    attachments?: Array<{
      title: string;
      storageKey: string;
      fileName: string;
      contentType: string;
      fileSize: number;
    }>;
  }) {
    const project = await projectRepository.findById(input.projectId);

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    const aiSummary = await aiSummaryService.generateSummary(input.description, input.amount);

    const changeOrder = await changeOrderRepository.create({
      ...input,
      status: "draft",
      aiSummary,
      attachments: (input.attachments ?? []).map((attachment) => ({
        id: "",
        changeOrderId: "",
        title: attachment.title,
        storageKey: attachment.storageKey,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        fileSize: attachment.fileSize,
        createdAt: "",
        updatedAt: ""
      }))
    });

    await auditLogService.record("change_order.created", "change_order", changeOrder.id, {
      projectId: changeOrder.projectId,
      amount: changeOrder.amount,
      attachmentCount: changeOrder.attachments.length,
      assignedTo: changeOrder.assignedTo
    });

    const recipients = await resolveChangeOrderRecipients({
      projectOwnerId: project.ownerId,
      assignedTo: changeOrder.assignedTo,
      requestedBy: changeOrder.requestedBy
    });

    if (recipients.length > 0) {
      await emailService.sendChangeOrderCreatedEmail({
        to: recipients.map((recipient) => recipient.email),
        changeOrderId: changeOrder.id,
        title: changeOrder.title,
        projectName: project.name,
        amount: changeOrder.amount
      });
    }

    return changeOrder;
  },
  async importChangeOrders(
    input: Array<{
      projectId: string;
      title: string;
      description: string;
      amount: number;
      requestedBy: string;
      assignedTo?: string;
    }>
  ) {
    if (input.length === 0) {
      throw new ApiError(400, "No change orders were provided for import.");
    }

    const rowsWithSummaries = await Promise.all(
      input.map(async (row) => ({
        ...row,
        assignedTo: row.assignedTo ?? row.requestedBy,
        status: "draft" as const,
        aiSummary: await aiSummaryService.generateSummary(row.description, row.amount),
        attachments: []
      }))
    );

    const createdChangeOrders = await changeOrderRepository.createMany(rowsWithSummaries);

    await Promise.all(
      createdChangeOrders.map((changeOrder) =>
        auditLogService.record("change_order.imported", "change_order", changeOrder.id, {
          projectId: changeOrder.projectId,
          amount: changeOrder.amount
        })
      )
    );

    return createdChangeOrders;
  },
  async createAttachmentUploadIntent(input: {
    projectId: string;
    fileName: string;
    contentType?: string;
    fileSize: number;
  }) {
    const project = await projectRepository.findById(input.projectId);

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    return storageService.createChangeOrderAttachmentUploadIntent(input);
  },
  async updateChangeOrder(
    user: AuthenticatedUser,
    changeOrderId: string,
    input: {
      projectId: string;
      title: string;
      description: string;
      amount: number;
      requestedBy: string;
      assignedTo: string;
    }
  ) {
    const existingChangeOrder = await this.getChangeOrder(changeOrderId);
    const existingProject = await projectRepository.findById(existingChangeOrder.projectId);

    if (!existingProject) {
      throw new ApiError(404, "Project not found.");
    }

    if (!canEditProject(user, existingProject.ownerId)) {
      throw new ApiError(403, "Only the project owner can edit this change order.");
    }

    if (existingProject.archivedAt || existingChangeOrder.archivedAt) {
      throw new ApiError(400, "Archived change orders are read-only.");
    }

    const nextProject = input.projectId === existingChangeOrder.projectId
      ? existingProject
      : await projectRepository.findById(input.projectId);

    if (!nextProject) {
      throw new ApiError(404, "Project not found.");
    }

    if (!canEditProject(user, nextProject.ownerId)) {
      throw new ApiError(403, "You can only move change orders into projects you own.");
    }

    if (nextProject.archivedAt) {
      throw new ApiError(400, "You cannot move a change order into an archived project.");
    }

    const aiSummary =
      input.description.trim() !== existingChangeOrder.description ||
      input.amount !== existingChangeOrder.amount
        ? await aiSummaryService.generateSummary(input.description, input.amount)
        : existingChangeOrder.aiSummary;

    const updatedChangeOrder = await changeOrderRepository.update(changeOrderId, {
      projectId: nextProject.id,
      title: input.title.trim(),
      description: input.description.trim(),
      amount: input.amount,
      requestedBy: input.requestedBy.trim(),
      assignedTo: input.assignedTo.trim(),
      status: existingChangeOrder.status,
      aiSummary
    });

    if (!updatedChangeOrder) {
      throw new ApiError(404, "Change order not found.");
    }

    await auditLogService.record("change_order.updated", "change_order", updatedChangeOrder.id, {
      projectId: updatedChangeOrder.projectId,
      amount: updatedChangeOrder.amount,
      assignedTo: updatedChangeOrder.assignedTo
    });

    return updatedChangeOrder;
  },
  async updateStatus(
    user: AuthenticatedUser,
    changeOrderId: string,
    status: "draft" | "pending_review" | "approved" | "rejected" | "synced"
  ) {
    const existingChangeOrder = await this.getChangeOrder(changeOrderId);
    const existingProject = await projectRepository.findById(existingChangeOrder.projectId);

    if (!existingProject) {
      throw new ApiError(404, "Project not found.");
    }

    if (!canEditProject(user, existingProject.ownerId)) {
      throw new ApiError(403, "Only the project owner can update change order status.");
    }

    if (existingProject.archivedAt || existingChangeOrder.archivedAt) {
      throw new ApiError(400, "Archived change orders are read-only.");
    }

    const changeOrder = await changeOrderRepository.updateStatus(changeOrderId, status);

    if (!changeOrder) {
      throw new ApiError(404, "Change order not found.");
    }

    await auditLogService.record("change_order.status_updated", "change_order", changeOrder.id, {
      status: changeOrder.status
    });

    const project = await projectRepository.findById(changeOrder.projectId);

    if (project) {
      const recipients = await resolveChangeOrderRecipients({
        projectOwnerId: project.ownerId,
        assignedTo: changeOrder.assignedTo,
        requestedBy: changeOrder.requestedBy
      });

      if (recipients.length > 0) {
        await emailService.sendChangeOrderStatusEmail({
          to: recipients.map((recipient) => recipient.email),
          changeOrderId: changeOrder.id,
          title: changeOrder.title,
          projectName: project.name,
          status: changeOrder.status
        });
      }
    }

    return changeOrder;
  },
  async archiveChangeOrder(user: AuthenticatedUser, changeOrderId: string) {
    const existingChangeOrder = await this.getChangeOrder(changeOrderId);
    const project = await projectRepository.findById(existingChangeOrder.projectId);

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    if (!canEditProject(user, project.ownerId)) {
      throw new ApiError(403, "Only the project owner can archive this change order.");
    }

    if (project.archivedAt) {
      throw new ApiError(400, "Archived projects are read-only.");
    }

    if (existingChangeOrder.archivedAt) {
      throw new ApiError(400, "Change order is already archived.");
    }

    const archivedChangeOrder = await changeOrderRepository.archive(changeOrderId);

    if (!archivedChangeOrder) {
      throw new ApiError(404, "Change order not found.");
    }

    await auditLogService.record("change_order.archived", "change_order", archivedChangeOrder.id, {
      projectId: archivedChangeOrder.projectId,
      status: archivedChangeOrder.status
    });

    return archivedChangeOrder;
  }
};
