import { z } from "zod";
import { getCachedFile } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";
import { searchNodes, findNodeById } from "../utils/designExtractor.js";

const SearchNodesSchema = z.object({
  link: z.string().describe("Figma file link or file ID"),
  query: z
    .string()
    .default("")
    .describe("Text to search in node names (optional)"),
  node_type: z
    .string()
    .optional()
    .describe(
      "Filter by node type: FRAME, GROUP, TEXT, COMPONENT, INSTANCE, RECTANGLE, VECTOR, etc."
    ),
  max_results: z
    .number()
    .optional()
    .default(50)
    .describe("Maximum number of results to return (default 50)"),
});

async function handleSearchNodes(params: z.infer<typeof SearchNodesSchema>) {
  getRateLimiter().checkLimit("search_nodes");
  const { fileId, nodeId } = parseFigmaLink(params.link);
  const file = await getCachedFile(fileId);
  const doc = file.document as Record<string, unknown>;

  let root: Record<string, unknown> = doc;
  if (nodeId) {
    const found = findNodeById(doc, nodeId);
    if (found) root = found;
  }

  const results = searchNodes(root, params.query ?? "", params.node_type).slice(
    0,
    params.max_results ?? 50
  );

  return [
    {
      type: "text" as const,
      text: JSON.stringify(
        { fileId, query: params.query, node_type: params.node_type, resultCount: results.length, results },
        null,
        2
      ),
    },
  ];
}

export const searchNodesTool = {
  name: "search_nodes",
  description:
    "Search for nodes in a Figma file by name or type (e.g. find all BUTTON components, TEXT nodes with a keyword, etc.).",
  schema: SearchNodesSchema,
  handler: handleSearchNodes,
};
