import { z } from "zod";

export const createChangeOrderSchema = z.object({
  body: z.object({
    projectId: z.string().min(2),
    title: z.string().min(2),
    description: z.string().min(10),
    amount: z.number().positive(),
    requestedBy: z.string().min(2),
    assignedTo: z.string().min(2),
    attachments: z
      .array(
        z.object({
          title: z.string().min(1).max(160),
          storageKey: z.string().min(5).max(512),
          fileName: z.string().min(1).max(255),
          contentType: z.string().min(1).max(120),
          fileSize: z.number().int().positive().max(25 * 1024 * 1024)
        })
      )
      .max(10)
      .optional()
  })
});

export const updateChangeOrderSchema = z.object({
  body: z.object({
    projectId: z.string().min(2),
    title: z.string().min(2),
    description: z.string().min(10),
    amount: z.number().positive(),
    requestedBy: z.string().min(2),
    assignedTo: z.string().min(2)
  })
});

export const createChangeOrderAttachmentUploadIntentSchema = z.object({
  body: z.object({
    projectId: z.string().min(2),
    fileName: z.string().min(1).max(255),
    contentType: z.string().min(1).max(120).optional(),
    fileSize: z.number().int().positive().max(25 * 1024 * 1024)
  })
});

export const addChangeOrderAttachmentsSchema = z.object({
  body: z.object({
    attachments: z
      .array(
        z.object({
          title: z.string().min(1).max(160),
          storageKey: z.string().min(5).max(512),
          fileName: z.string().min(1).max(255),
          contentType: z.string().min(1).max(120),
          fileSize: z.number().int().positive().max(25 * 1024 * 1024)
        })
      )
      .min(1)
      .max(10)
  })
});

export const createChangeOrderCommentSchema = z.object({
  body: z.object({
    authorName: z.string().min(2).max(120),
    body: z.string().min(2).max(2000)
  })
});

export const importChangeOrdersSchema = z.object({
  body: z.object({
    changeOrders: z
      .array(
        z.object({
          projectId: z.string().min(2),
          title: z.string().min(2),
          description: z.string().min(10),
          amount: z.number().positive(),
          requestedBy: z.string().min(2),
          assignedTo: z.string().min(2).optional()
        })
      )
      .min(1)
  })
});

export const updateChangeOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["draft", "pending_review", "approved", "rejected", "synced"])
  })
});
