import { z } from "zod";
import { getCachedFile, summarizeNode } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";

const GetPageLayersSchema = z.object({
  link: z.string().describe("Figma file link or file ID"),
  page_name: z
    .string()
    .optional()
    .describe("Filter to a specific page by name (optional, returns all pages if omitted)"),
});

async function handleGetPageLayers(params: z.infer<typeof GetPageLayersSchema>) {
  getRateLimiter().checkLimit("get_page_layers");
  const { fileId } = parseFigmaLink(params.link);
  const file = await getCachedFile(fileId);
  const doc = file.document as Record<string, unknown>;
  let pages = doc.children as Record<string, unknown>[];

  if (params.page_name) {
    pages = pages.filter(
      (p) => (p.name as string).toLowerCase() === params.page_name!.toLowerCase()
    );
  }

  const result = pages.map((page) => ({
    id: page.id,
    name: page.name,
    type: page.type,
    layers: summarizeNode(page, 0, 8),
  }));

  return [
    {
      type: "text" as const,
      text: JSON.stringify({ fileId, pages: result }, null, 2),
    },
  ];
}

export const getPageLayersTool = {
  name: "get_page_layers",
  description: "Get all layers on a specific page (or all pages) of a Figma file.",
  schema: GetPageLayersSchema,
  handler: handleGetPageLayers,
};
