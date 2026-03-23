import { z } from "zod";

export const createChangeOrderSchema = z.object({
  body: z.object({
    projectId: z.string().min(2),
    title: z.string().min(2),
    description: z.string().min(10),
    amount: z.number().positive(),
    requestedBy: z.string().min(2)
  })
});

export const updateChangeOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["draft", "pending_review", "approved", "rejected", "synced"])
  })
});

