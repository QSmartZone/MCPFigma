import { z } from "zod";
import { getCachedFile, getFigmaClient } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";
import { collectImageFillRefs, findNodeById } from "../utils/designExtractor.js";

const GetNodeAssetsSchema = z.object({
  link: z.string().describe("Figma node link or file ID"),
  format: z
    .enum(["png", "svg", "jpg", "pdf"])
    .optional()
    .default("png")
    .describe("Export format (default: png)"),
  scale: z
    .number()
    .optional()
    .default(2)
    .describe("Export scale multiplier (default: 2)"),
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

async function handleGetNodeAssets(params: z.infer<typeof GetNodeAssetsSchema>) {
  getRateLimiter().checkLimit("get_node_assets");
  const { fileId, nodeId } = parseFigmaLink(params.link);
  const file = await getCachedFile(fileId);
  const node = resolveNodeFromFile(file, nodeId);
  const client = getFigmaClient();

  const imageFillRefs = collectImageFillRefs(node);
  let imageFillUrls: Record<string, unknown> = {};
  if (imageFillRefs.length > 0) {
    imageFillUrls = await client.getImageFills(fileId);
  }

  const nodeIds = nodeId ? [nodeId] : [];
  let exportUrls: Record<string, unknown> = {};
  if (nodeIds.length > 0) {
    exportUrls = await client.getNodeImages(fileId, nodeIds, params.format ?? "png", params.scale ?? 2);
  }

  return [
    {
      type: "text" as const,
      text: JSON.stringify(
        {
          fileId,
          nodeId,
          exportUrls,
          imageFillRefs,
          imageFillUrls: (imageFillUrls as Record<string, unknown>).meta,
        },
        null,
        2
      ),
    },
  ];
}

export const getNodeAssetsTool = {
  name: "get_node_assets",
  description: "Get exportable image assets and image fills for a Figma node. Returns URLs for PNG/SVG exports.",
  schema: GetNodeAssetsSchema,
  handler: handleGetNodeAssets,
};
