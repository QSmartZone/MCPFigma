import { z } from "zod";
import { getCachedFile } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { extractNodeContext, findNodeById } from "../utils/designExtractor.js";

const GetNodeContextSchema = z.object({
  link: z
    .string()
    .describe(
      "Figma node link (e.g. https://www.figma.com/design/FILE/...?node-id=1-127) or plain file ID"
    ),
  max_depth: z
    .number()
    .optional()
    .default(10)
    .describe("Max depth for children traversal (default 10)"),
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

async function handleGetNodeContext(params: z.infer<typeof GetNodeContextSchema>) {
const { fileId, nodeId } = parseFigmaLink(params.link);
  const file = await getCachedFile(fileId);
  const node = resolveNodeFromFile(file, nodeId);
  const context = extractNodeContext(node, 0, params.max_depth ?? 10);

  return [
    {
      type: "text" as const,
      text: JSON.stringify(
        {
          fileId,
          nodeName: context.name,
          nodeType: context.type,
          context,
        },
        null,
        2
      ),
    },
  ];
}

export const getNodeContextTool = {
  name: "get_node_context",
  description:
    "Get complete design context for a Figma node: colors, typography, spacing, effects, components, children hierarchy. Paste a Figma link or node ID.",
  schema: GetNodeContextSchema,
  handler: handleGetNodeContext,
};
