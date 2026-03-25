import { prisma } from "../config/db.js";
import type { ChangeOrderAttachmentRecord, ChangeOrderRecord } from "../types/domain.js";

type ChangeOrderAttachmentRow = {
  id: string;
  changeOrderId: string;
  title: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
};

type ChangeOrderRow = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: ChangeOrderRecord["status"];
  archivedAt: Date | null;
  amount: { toNumber(): number };
  requestedBy: string;
  assignedTo: string | null;
  externalReference: string | null;
  aiSummary: string | null;
  attachments: ChangeOrderAttachmentRow[];
  createdAt: Date;
  updatedAt: Date;
};

const changeOrderClient = (prisma as unknown as {
  changeOrder: {
    findMany(args: unknown): Promise<ChangeOrderRow[]>;
    findUnique(args: unknown): Promise<ChangeOrderRow | null>;
    create(args: unknown): Promise<ChangeOrderRow>;
    update(args: unknown): Promise<ChangeOrderRow>;
  };
}).changeOrder;

function mapChangeOrderAttachment(attachment: ChangeOrderAttachmentRow): ChangeOrderAttachmentRecord {
  return {
    id: attachment.id,
    changeOrderId: attachment.changeOrderId,
    title: attachment.title,
    storageKey: attachment.storageKey,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    fileSize: attachment.fileSize,
    createdAt: attachment.createdAt.toISOString(),
    updatedAt: attachment.updatedAt.toISOString()
  };
}

function mapChangeOrder(changeOrder: ChangeOrderRow): ChangeOrderRecord {
  return {
    id: changeOrder.id,
    projectId: changeOrder.projectId,
    title: changeOrder.title,
    description: changeOrder.description,
    status: changeOrder.status,
    archivedAt: changeOrder.archivedAt?.toISOString() ?? undefined,
    amount: changeOrder.amount.toNumber(),
    requestedBy: changeOrder.requestedBy,
    assignedTo: changeOrder.assignedTo ?? undefined,
    externalReference: changeOrder.externalReference ?? undefined,
    aiSummary: changeOrder.aiSummary ?? undefined,
    attachments: changeOrder.attachments.map(mapChangeOrderAttachment),
    createdAt: changeOrder.createdAt.toISOString(),
    updatedAt: changeOrder.updatedAt.toISOString()
  };
}

export const changeOrderRepository = {
  async list(projectId?: string, options?: { includeArchived?: boolean }) {
    const changeOrders = await changeOrderClient.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(options?.includeArchived ? {} : { archivedAt: null })
      },
      include: {
        attachments: {
          orderBy: [{ createdAt: "asc" }]
        }
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });

    return changeOrders.map(mapChangeOrder);
  },
  async findById(changeOrderId: string) {
    const changeOrder = await changeOrderClient.findUnique({
      where: { id: changeOrderId },
      include: {
        attachments: {
          orderBy: [{ createdAt: "asc" }]
        }
      }
    });

    return changeOrder ? mapChangeOrder(changeOrder) : null;
  },
  async create(changeOrder: Omit<ChangeOrderRecord, "id" | "createdAt" | "updatedAt">) {
    const createdChangeOrder = await changeOrderClient.create({
      data: {
        projectId: changeOrder.projectId,
        title: changeOrder.title,
        description: changeOrder.description,
        status: changeOrder.status,
        amount: changeOrder.amount,
        requestedBy: changeOrder.requestedBy,
        assignedTo: changeOrder.assignedTo,
        externalReference: changeOrder.externalReference,
        aiSummary: changeOrder.aiSummary,
        attachments:
          changeOrder.attachments.length > 0
            ? {
                create: changeOrder.attachments.map((attachment) => ({
                  title: attachment.title,
                  storageKey: attachment.storageKey,
                  fileName: attachment.fileName,
                  contentType: attachment.contentType,
                  fileSize: attachment.fileSize
                }))
              }
            : undefined
      },
      include: {
        attachments: {
          orderBy: [{ createdAt: "asc" }]
        }
      }
    });

    return mapChangeOrder(createdChangeOrder);
  },
  async createMany(changeOrders: Array<Omit<ChangeOrderRecord, "id" | "createdAt" | "updatedAt">>) {
    if (changeOrders.length === 0) {
      return [];
    }

    const createdChangeOrders: ChangeOrderRow[] = [];

    for (const changeOrder of changeOrders) {
      createdChangeOrders.push(
        await changeOrderClient.create({
          data: {
            projectId: changeOrder.projectId,
            title: changeOrder.title,
            description: changeOrder.description,
            status: changeOrder.status,
            amount: changeOrder.amount,
            requestedBy: changeOrder.requestedBy,
            assignedTo: changeOrder.assignedTo,
            externalReference: changeOrder.externalReference,
            aiSummary: changeOrder.aiSummary,
            attachments:
              changeOrder.attachments.length > 0
                ? {
                    create: changeOrder.attachments.map((attachment) => ({
                      title: attachment.title,
                      storageKey: attachment.storageKey,
                      fileName: attachment.fileName,
                      contentType: attachment.contentType,
                      fileSize: attachment.fileSize
                    }))
                  }
                : undefined
          },
          include: {
            attachments: {
              orderBy: [{ createdAt: "asc" }]
            }
          }
        })
      );
    }

    return createdChangeOrders.map(mapChangeOrder);
  },
  async update(
    changeOrderId: string,
    input: {
      projectId: string;
      title: string;
      description: string;
      amount: number;
      requestedBy: string;
      assignedTo?: string;
      status: ChangeOrderRecord["status"];
      aiSummary?: string;
    }
  ) {
    const existing = await changeOrderClient.findUnique({
      where: { id: changeOrderId },
      include: {
        attachments: {
          orderBy: [{ createdAt: "asc" }]
        }
      }
    });

    if (!existing) {
      return null;
    }

    const updated = await changeOrderClient.update({
      where: { id: changeOrderId },
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        amount: input.amount,
        requestedBy: input.requestedBy,
        assignedTo: input.assignedTo,
        status: input.status,
        aiSummary: input.aiSummary
      },
      include: {
        attachments: {
          orderBy: [{ createdAt: "asc" }]
        }
      }
    });

    return mapChangeOrder(updated);
  },
  async updateStatus(changeOrderId: string, status: ChangeOrderRecord["status"]) {
    const existing = await changeOrderClient.findUnique({
      where: { id: changeOrderId },
      include: {
        attachments: {
          orderBy: [{ createdAt: "asc" }]
        }
      }
    });

    if (!existing) {
      return null;
    }

    const updated = await changeOrderClient.update({
      where: { id: changeOrderId },
      data: { status },
      include: {
        attachments: {
          orderBy: [{ createdAt: "asc" }]
        }
      }
    });

    return mapChangeOrder(updated);
  },
  async archive(changeOrderId: string) {
    const existing = await changeOrderClient.findUnique({
      where: { id: changeOrderId },
      include: {
        attachments: {
          orderBy: [{ createdAt: "asc" }]
        }
      }
    });

    if (!existing) {
      return null;
    }

    const archived = await changeOrderClient.update({
      where: { id: changeOrderId },
      data: {
        archivedAt: new Date()
      },
      include: {
        attachments: {
          orderBy: [{ createdAt: "asc" }]
        }
      }
    });

    return mapChangeOrder(archived);
  }
};
