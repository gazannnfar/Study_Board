import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // AI assistant provider. "rule" = deterministic rule-based (no network, default).
  // "llm" = OpenAI-compatible Chat Completions API (Groq, OpenRouter, OpenAI, local).
  AI_PROVIDER: z.enum(["rule", "llm"]).default("rule"),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().default("https://api.groq.com/openai/v1"),
  AI_MODEL: z.string().default("llama-3.3-70b-versatile"),
  AI_TIMEOUT_MS: z.coerce.number().default(12000)
});

export const env = envSchema.parse(process.env);
