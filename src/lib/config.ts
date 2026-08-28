import "server-only";

import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must contain at least 32 characters"),
  AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  AI_MODEL: z.string().min(1).default("missionpro-nova-smoke"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export type ServerConfig = z.infer<typeof environmentSchema>;

export function getServerConfig(): ServerConfig {
  const parsed = environmentSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid server configuration: ${details}`);
  }
  if (parsed.data.AI_PROVIDER === "openai" && !parsed.data.OPENAI_API_KEY) {
    throw new Error("Invalid server configuration: OPENAI_API_KEY is required when AI_PROVIDER=openai");
  }
  return parsed.data;
}

export function isServerConfigPresent(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.SESSION_SECRET);
}