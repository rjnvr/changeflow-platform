import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    password: z.string().min(8)
  })
});

export const requestPasswordResetSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    password: z.string().min(8)
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    email: z.string().email(),
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50)
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8)
  })
});

export const updateBriefQuotaSchema = z.object({
  body: z.object({
    dailyProjectBriefLimit: z.number().int().min(1).max(150)
  })
});

export const applyBriefQuotaToAllSchema = z.object({
  body: z.object({
    dailyProjectBriefLimit: z.number().int().min(1).max(150)
  })
});
