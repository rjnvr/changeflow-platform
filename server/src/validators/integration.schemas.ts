import { z } from "zod";

export const syncChangeOrderSchema = z.object({
  body: z.object({
    changeOrderId: z.string().min(2),
    provider: z.string().min(2)
  })
});

export const webhookPayloadSchema = z.object({
  body: z.object({
    provider: z.string().min(2),
    eventType: z.string().min(2),
    payload: z.record(z.string(), z.unknown()).optional()
  })
});

