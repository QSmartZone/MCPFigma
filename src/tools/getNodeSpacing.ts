import { z } from "zod";
import { getCachedFile } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";
import { extractSpacing, findNodeById } from "../utils/designExtractor.js";

const GetNodeSpacingSchema = z.object({
  link: z.string().describe("Figma node link or file ID"),
});

function resolveNodeFromFile(
  file: Record<string, unknown>,
  nodeId: string | null
): Record<string, unknown> {
  const document = file.document as Record<string, unknown>;
  if (!nodeId) return document;

  const found = findNodeById(document, nodeId);
  if (!found) {
    throw new Error(
      `Node "${nodeId}" not found in file. Make sure the node-id in the link is correct.`
    );
  }
  return found;
}

async function handleGetNodeSpacing(params: z.infer<typeof GetNodeSpacingSchema>) {
  getRateLimiter().checkLimit("get_node_spacing");
  const { fileId, nodeId } = parseFigmaLink(params.link);
  const file = await getCachedFile(fileId);
  const node = resolveNodeFromFile(file, nodeId);

  const children = (node.children as Record<string, unknown>[] | undefined) ?? [];
  const spacingList = [
    { id: node.id, name: node.name, type: node.type, spacing: extractSpacing(node) },
    ...children.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      spacing: extractSpacing(c),
    })),
  ];

  return [
    {
      type: "text" as const,
      text: JSON.stringify({ fileId, nodeId, spacingList }, null, 2),
    },
  ];
}

export const getNodeSpacingTool = {
  name: "get_node_spacing",
  description:
    "Get spacing, layout, and sizing info (padding, item spacing, width, height, corner radius, auto-layout) for a Figma node.",
  schema: GetNodeSpacingSchema,
  handler: handleGetNodeSpacing,
};
