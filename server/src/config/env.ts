import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8).default("change-me"),
  SLACK_WEBHOOK_URL: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default("")
});

export const env = envSchema.parse(process.env);

