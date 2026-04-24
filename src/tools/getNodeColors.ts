import { z } from "zod";
import { getCachedFile } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";
import { collectAllColors, findNodeById } from "../utils/designExtractor.js";

const GetNodeColorsSchema = z.object({
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

async function handleGetNodeColors(params: z.infer<typeof GetNodeColorsSchema>) {
  getRateLimiter().checkLimit("get_node_colors");
  const { fileId, nodeId } = parseFigmaLink(params.link);
  const file = await getCachedFile(fileId);
  const node = resolveNodeFromFile(file, nodeId);
  const colors = collectAllColors(node);

  return [
    {
      type: "text" as const,
      text: JSON.stringify({ fileId, nodeId, colorCount: colors.length, colors }, null, 2),
    },
  ];
}

export const getNodeColorsTool = {
  name: "get_node_colors",
  description:
    "Extract all unique colors (fills, strokes, backgrounds) used in a Figma node and its children.",
  schema: GetNodeColorsSchema,
  handler: handleGetNodeColors,
};
