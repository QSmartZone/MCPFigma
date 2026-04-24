import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config.js";
import { initializeFigmaClient } from "./figma/client.js";
import { initializeRateLimiter } from "./security/rateLimiter.js";
import { getNodeContextTool } from "./tools/getNodeContext.js";
import { getNodeLayersTool } from "./tools/getNodeLayers.js";
import { getNodeColorsTool } from "./tools/getNodeColors.js";
import { getNodeSpacingTool } from "./tools/getNodeSpacing.js";
import { getNodeTextContentTool } from "./tools/getNodeTextContent.js";
import { getNodeAssetsTool } from "./tools/getNodeAssets.js";
import { getNodeScreenshotTool } from "./tools/getNodeScreenshot.js";
import { getFileInfoTool } from "./tools/getFileInfo.js";
import { getFileStylesTool } from "./tools/getFileStyles.js";
import { getFileTextStylesTool } from "./tools/getFileTextStyles.js";
import { getFileColorStylesTool } from "./tools/getFileColorStyles.js";
import { getFileComponentsTool } from "./tools/getFileComponents.js";
import { getFileVariablesTool } from "./tools/getFileVariables.js";
import { getPageLayersTool } from "./tools/getPageLayers.js";
import { getFileCommentsTool } from "./tools/getFileComments.js";
import { searchNodesTool } from "./tools/searchNodes.js";
import { getComponentTool } from "./tools/getComponent.js";

// ─── Initialize singleton services ────────────────────────────────────────────

initializeFigmaClient(config.figmaToken);
initializeRateLimiter(config.rateLimitPerMinute);

// ─── Create and configure MCP server ──────────────────────────────────────────

const server = new McpServer({
  name: "mcp-figma",
  version: "1.0.0",
});

// ─── Register all tools ───────────────────────────────────────────────────────

const tools = [
  getNodeContextTool,
  getNodeLayersTool,
  getNodeColorsTool,
  getNodeSpacingTool,
  getNodeTextContentTool,
  getNodeAssetsTool,
  getNodeScreenshotTool,
  getFileInfoTool,
  getFileStylesTool,
  getFileTextStylesTool,
  getFileColorStylesTool,
  getFileComponentsTool,
  getFileVariablesTool,
  getPageLayersTool,
  getFileCommentsTool,
  searchNodesTool,
  getComponentTool,
];

for (const tool of tools) {
  server.tool(tool.name, tool.description, tool.schema.shape, async (params: Record<string, unknown>) => {
    try {
      const content = await tool.handler(params as any);
      return { content };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: message }, null, 2) }],
      };
    }
  });
}

// ─── Start server ────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write("MCP Figma server started (stdio transport)\n");
