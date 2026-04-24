import { z } from "zod";
import { getCachedFile } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";
import { collectTextNodes, findNodeById } from "../utils/designExtractor.js";

const GetNodeTextContentSchema = z.object({
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

async function handleGetNodeTextContent(params: z.infer<typeof GetNodeTextContentSchema>) {
  getRateLimiter().checkLimit("get_node_text_content");
  const { fileId, nodeId } = parseFigmaLink(params.link);
  const file = await getCachedFile(fileId);
  const node = resolveNodeFromFile(file, nodeId);
  const textNodes = collectTextNodes(node);

  return [
    {
      type: "text" as const,
      text: JSON.stringify(
        { fileId, nodeId, textCount: textNodes.length, textNodes },
        null,
        2
      ),
    },
  ];
}

export const getNodeTextContentTool = {
  name: "get_node_text_content",
  description:
    "Extract all text content and typography styles (font, size, weight, line height, letter spacing) from a Figma node.",
  schema: GetNodeTextContentSchema,
  handler: handleGetNodeTextContent,
};
