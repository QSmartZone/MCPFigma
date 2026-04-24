import { z } from "zod";

const ConfigSchema = z.object({
  figmaToken: z.string().min(1, "FIGMA_TOKEN is required"),
  rateLimitPerMinute: z.coerce.number().default(30),
  logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

export const config = ConfigSchema.parse({
  figmaToken: process.env.FIGMA_TOKEN,
  rateLimitPerMinute: process.env.RATE_LIMIT_PER_MINUTE,
  logLevel: process.env.LOG_LEVEL,
});
