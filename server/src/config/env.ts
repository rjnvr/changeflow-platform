import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8).default("change-me"),
  SLACK_WEBHOOK_URL: z.string().optional().default(""),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  ANTHROPIC_MODEL: z.string().optional().default("claude-haiku-4-5"),
  VOYAGE_API_KEY: z.string().optional().default(""),
  VOYAGE_EMBEDDING_MODEL: z.string().optional().default("voyage-3.5-lite"),
  EMAIL_PROVIDER: z.string().optional().default("resend"),
  EMAIL_FROM: z.string().optional().default("notifications@changeflow.dev"),
  EMAIL_API_KEY: z.string().optional().default(""),
  APP_BASE_URL: z.string().optional().default("http://localhost:5173"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  MICROSOFT_CLIENT_ID: z.string().optional().default(""),
  MICROSOFT_CLIENT_SECRET: z.string().optional().default(""),
  S3_BUCKET: z.string().optional().default(""),
  S3_REGION: z.string().optional().default(""),
  S3_ACCESS_KEY_ID: z.string().optional().default(""),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
  PROCORE_BASE_URL: z.string().optional().default(""),
  PROCORE_CLIENT_ID: z.string().optional().default(""),
  PROCORE_CLIENT_SECRET: z.string().optional().default(""),
  QUICKBOOKS_CLIENT_ID: z.string().optional().default(""),
  QUICKBOOKS_CLIENT_SECRET: z.string().optional().default(""),
  NETSUITE_ACCOUNT_ID: z.string().optional().default(""),
  NETSUITE_CLIENT_ID: z.string().optional().default(""),
  NETSUITE_CLIENT_SECRET: z.string().optional().default(""),
  WEBHOOK_SIGNING_SECRET: z.string().optional().default("")
});

export const env = envSchema.parse(process.env);
