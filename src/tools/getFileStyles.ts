import { z } from "zod";
import { getFigmaClient } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";

const GetFileStylesSchema = z.object({
  link: z.string().describe("Figma file link or file ID"),
  style_type: z
    .enum(["FILL", "TEXT", "EFFECT", "GRID", "ALL"])
    .optional()
    .default("ALL")
    .describe("Filter by style type (default: ALL)"),
});

async function handleGetFileStyles(params: z.infer<typeof GetFileStylesSchema>) {
  getRateLimiter().checkLimit("get_file_styles");
  const { fileId } = parseFigmaLink(params.link);
  const client = getFigmaClient();
  const data = await client.getFileStyles(fileId);
  const meta = (data as Record<string, unknown>).meta as Record<string, unknown>;
  let styles = (meta?.styles as Record<string, unknown>[]) ?? [];

  if (params.style_type && params.style_type !== "ALL") {
    styles = styles.filter((s) => s.style_type === params.style_type);
  }

  return [
    {
      type: "text" as const,
      text: JSON.stringify(
        { fileId, styleCount: styles.length, styles },
        null,
        2
      ),
    },
  ];
}

export const getFileStylesTool = {
  name: "get_file_styles",
  description: "Get all design styles (color, text, effect, grid) defined in a Figma file.",
  schema: GetFileStylesSchema,
  handler: handleGetFileStyles,
};
