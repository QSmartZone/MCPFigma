import { z } from "zod";
import { getCachedFile, summarizeNode } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";
import { findNodeById } from "../utils/designExtractor.js";

const GetNodeLayersSchema = z.object({
  link: z.string().describe("Figma node link or file ID"),
  max_depth: z
    .number()
    .optional()
    .default(15)
    .describe("Max depth for layer tree (default 15)"),
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

async function handleGetNodeLayers(params: z.infer<typeof GetNodeLayersSchema>) {
  getRateLimiter().checkLimit("get_node_layers");
  const { fileId, nodeId } = parseFigmaLink(params.link);
  const file = await getCachedFile(fileId);
  const node = resolveNodeFromFile(file, nodeId);
  const layers = summarizeNode(node as Record<string, unknown>, 0, params.max_depth ?? 15);

  return [
    {
      type: "text" as const,
      text: JSON.stringify({ fileId, nodeId, layers }, null, 2),
    },
  ];
}

export const getNodeLayersTool = {
  name: "get_node_layers",
  description: "Get the layer hierarchy (tree of names, types, IDs) for a Figma node.",
  schema: GetNodeLayersSchema,
  handler: handleGetNodeLayers,
};
