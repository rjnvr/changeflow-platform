import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    location: z.string().min(2),
    status: z.enum(["active", "on-hold", "completed"]),
    contractValue: z.number().positive(),
    ownerId: z.string().min(2)
  })
});

