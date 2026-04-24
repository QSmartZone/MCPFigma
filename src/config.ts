import { z } from "zod";

const ConfigSchema = z.object({
  figmaToken: z.string().min(1, "FIGMA_TOKEN is required"),
  logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

export const config = ConfigSchema.parse({
  figmaToken: process.env.FIGMA_TOKEN,
  logLevel: process.env.LOG_LEVEL,
});
