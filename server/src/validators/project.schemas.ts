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

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    location: z.string().min(2),
    status: z.enum(["active", "on-hold", "completed"]),
    contractValue: z.number().positive()
  })
});

export const createProjectTeamMemberSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    role: z.string().min(2).max(80)
  })
});

export const updateProjectTeamMemberSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    role: z.string().min(2).max(80)
  })
});

export const createProjectDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(120),
    kind: z.string().min(2).max(40),
    summary: z.string().min(10).max(500),
    assignedTo: z.string().min(2).max(80).optional().or(z.literal("")),
    url: z.string().url().optional().or(z.literal("")),
    storageKey: z.string().min(5).max(512).optional(),
    fileName: z.string().min(1).max(255).optional(),
    contentType: z.string().min(1).max(120).optional(),
    fileSize: z.number().int().positive().max(25 * 1024 * 1024).optional()
  }).superRefine((value, ctx) => {
    const hasExternalUrl = Boolean(value.url && value.url.trim());
    const hasUploadedFile = Boolean(value.storageKey);

    if (!hasExternalUrl && !hasUploadedFile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Attach a file or provide a document link."
      });
    }

    if (hasUploadedFile && !value.fileName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileName"],
        message: "Uploaded documents need a file name."
      });
    }
  })
});

export const updateProjectDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(120),
    kind: z.string().min(2).max(40),
    summary: z.string().min(10).max(500),
    assignedTo: z.string().min(2).max(80).optional().or(z.literal("")),
    url: z.string().url().optional().or(z.literal(""))
  })
});

export const createProjectDocumentUploadIntentSchema = z.object({
  body: z.object({
    fileName: z.string().min(1).max(255),
    contentType: z.string().min(1).max(120).optional(),
    fileSize: z.number().int().positive().max(25 * 1024 * 1024)
  })
});

export const bulkUpdateProjectStatusSchema = z.object({
  body: z.object({
    projectIds: z.array(z.string().min(2)).min(1),
    status: z.enum(["active", "on-hold", "completed"])
  })
});
