import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  figmaGet,
  getToken,
  parseFileUrl,
  parseNodeUrl,
  extractBounds,
  extractAutoLayout,
  extractTypography,
  extractFills,
  extractStrokes,
  extractEffects,
  extractCorners,
  extractConstraints,
  extractComponentInfo,
  buildLayerTree,
  collectColors,
  collectTextNodes,
  traverseNodes,
  type FigmaNode,
} from "./client.js";

const server = new McpServer({ name: "mcp-figma", version: "2.0.0" });

// ─── FILE-LEVEL TOOLS ───────────────────────────────────────────────────────

server.tool(
  "get_file_info",
  "Get Figma file metadata: name, version, last modified, thumbnail URL, and all pages with their top-level frame names.",
  { fileUrl: z.string().describe("Any Figma file URL") },
  async ({ fileUrl }) => {
    const token = getToken();
    const key = parseFileUrl(fileUrl);

    const data = await figmaGet<{
      name: string;
      version: string;
      lastModified: string;
      thumbnailUrl: string;
      document: { children: FigmaNode[] };
    }>(`/files/${key}?depth=2`, token);

    const pages = data.document.children.map((page) => ({
      id: page.id,
      name: page.name,
      type: page.type,
      frameCount: (page.children as FigmaNode[] | undefined)?.length ?? 0,
      topLevelFrames: (page.children as FigmaNode[] | undefined)?.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        bounds: extractBounds(f),
      })) ?? [],
    }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          name: data.name,
          version: data.version,
          lastModified: data.lastModified,
          thumbnailUrl: data.thumbnailUrl,
          fileKey: key,
          pages,
        }, null, 2),
      }],
    };
  }
);

server.tool(
  "get_page_layers",
  "Get all layers/frames on a specific page. Returns the full layer tree for the page with bounds, types, and component references.",
  {
    fileUrl: z.string().describe("Any Figma file URL"),
    pageName: z.string().describe("Page name (exact, case-sensitive)"),
    depth: z.number().optional().default(3).describe("Layer tree depth (1–6, default 3)"),
    includeStyles: z.boolean().optional().default(false).describe("Include fill/typography per layer"),
  },
  async ({ fileUrl, pageName, depth, includeStyles }) => {
    const token = getToken();
    const key = parseFileUrl(fileUrl);

    const data = await figmaGet<{
      document: { children: FigmaNode[] };
    }>(`/files/${key}?depth=${Math.min(depth + 1, 6)}`, token);

    const page = data.document.children.find(
      (p) => (p.name as string).toLowerCase() === pageName.toLowerCase()
    );
    if (!page) {
      const names = data.document.children.map((p) => p.name).join(", ");
      throw new Error(`Page "${pageName}" not found. Available pages: ${names}`);
    }

    const tree = buildLayerTree(page, 0, depth, includeStyles);
    return {
      content: [{ type: "text", text: JSON.stringify(tree, null, 2) }],
    };
  }
);

server.tool(
  "get_file_components",
  "Get all components and component sets defined in the Figma file. Includes component key, name, description, and containing page.",
  {
    fileUrl: z.string().describe("Any Figma file URL"),
  },
  async ({ fileUrl }) => {
    const token = getToken();
    const key = parseFileUrl(fileUrl);

    const compsData = await figmaGet<{ meta: { components: FigmaNode[] } }>(`/files/${key}/components`, token);
    const setsData = await figmaGet<{ meta: { component_sets: FigmaNode[] } }>(`/files/${key}/component_sets`, token);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          components: compsData.meta.components,
          componentSets: setsData.meta.component_sets,
          totals: {
            components: compsData.meta.components.length,
            componentSets: setsData.meta.component_sets.length,
          },
        }, null, 2),
      }],
    };
  }
);

server.tool(
  "get_file_styles",
  "Get all published local styles in the Figma file: text styles (typography), color styles, effect styles, and grid styles with their metadata.",
  {
    fileUrl: z.string().describe("Any Figma file URL"),
    styleType: z
      .enum(["ALL", "TEXT", "FILL", "EFFECT", "GRID"])
      .optional()
      .default("ALL")
      .describe("Filter by style type"),
  },
  async ({ fileUrl, styleType }) => {
    const token = getToken();
    const key = parseFileUrl(fileUrl);

    const data = await figmaGet<{
      meta: {
        styles: Array<{
          key: string;
          name: string;
          description: string;
          style_type: string;
          created_at: string;
          updated_at: string;
          node_id: string;
        }>;
      };
    }>(`/files/${key}/styles`, token);

    const styles =
      styleType === "ALL"
        ? data.meta.styles
        : data.meta.styles.filter((s) => s.style_type === styleType);

    const grouped: Record<string, unknown[]> = {};
    for (const s of styles) {
      if (!grouped[s.style_type]) grouped[s.style_type] = [];
      grouped[s.style_type].push(s);
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ grouped, total: styles.length }, null, 2) }],
    };
  }
);

server.tool(
  "get_file_text_styles",
  "Extract all text styles with full typography values (font family, size, weight, line height, letter spacing, etc.) by reading nodes that use each style.",
  {
    fileUrl: z.string().describe("Any Figma file URL"),
  },
  async ({ fileUrl }) => {
    const token = getToken();
    const key = parseFileUrl(fileUrl);

    // Get style metadata
    const stylesData = await figmaGet<{
      meta: { styles: Array<{ key: string; name: string; style_type: string; node_id: string }> };
    }>(`/files/${key}/styles`, token);

    const textStyles = stylesData.meta.styles.filter((s) => s.style_type === "TEXT");
    if (!textStyles.length) {
      return { content: [{ type: "text", text: "No text styles found in file." }] };
    }

    // Batch fetch all text style nodes
    const nodeIds = textStyles.map((s) => s.node_id).join(",");
    const nodesData = await figmaGet<{
      nodes: Record<string, { document: FigmaNode }>;
    }>(`/files/${key}/nodes?ids=${encodeURIComponent(nodeIds)}`, token);

    const result = textStyles.map((s) => {
      const nodeEntry = nodesData.nodes[s.node_id];
      if (!nodeEntry) return { ...s, values: null };
      const doc = nodeEntry.document;
      const style = doc.style as FigmaNode | undefined;
      return {
        key: s.key,
        name: s.name,
        nodeId: s.node_id,
        values: {
          fontFamily: style?.fontFamily,
          fontPostScriptName: style?.fontPostScriptName,
          fontWeight: style?.fontWeight,
          fontStyle: style?.italic ? "italic" : "normal",
          fontSize: style?.fontSize,
          lineHeightPx: style?.lineHeightPx,
          lineHeightPercent: style?.lineHeightPercent,
          lineHeightUnit: style?.lineHeightUnit,
          letterSpacing: style?.letterSpacing,
          textAlignHorizontal: style?.textAlignHorizontal,
          textAlignVertical: style?.textAlignVertical,
          textDecoration: style?.textDecoration ?? "NONE",
          textCase: style?.textCase ?? "ORIGINAL",
          paragraphSpacing: style?.paragraphSpacing ?? 0,
          paragraphIndent: style?.paragraphIndent ?? 0,
        },
      };
    });

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_file_color_styles",
  "Extract all color/fill styles with actual RGBA and HEX values by reading nodes that use each style.",
  {
    fileUrl: z.string().describe("Any Figma file URL"),
  },
  async ({ fileUrl }) => {
    const token = getToken();
    const key = parseFileUrl(fileUrl);

    const stylesData = await figmaGet<{
      meta: { styles: Array<{ key: string; name: string; style_type: string; node_id: string }> };
    }>(`/files/${key}/styles`, token);

    const fillStyles = stylesData.meta.styles.filter((s) => s.style_type === "FILL");
    if (!fillStyles.length) {
      return { content: [{ type: "text", text: "No color styles found in file." }] };
    }

    const nodeIds = fillStyles.map((s) => s.node_id).join(",");
    const nodesData = await figmaGet<{
      nodes: Record<string, { document: FigmaNode }>;
    }>(`/files/${key}/nodes?ids=${encodeURIComponent(nodeIds)}`, token);

    const result = fillStyles.map((s) => {
      const nodeEntry = nodesData.nodes[s.node_id];
      if (!nodeEntry) return { ...s, fills: null };
      const doc = nodeEntry.document;
      return {
        key: s.key,
        name: s.name,
        nodeId: s.node_id,
        fills: extractFills(doc),
      };
    });

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_file_variables",
  "Get all design tokens (variables) and variable collections from the Figma file. Requires Editor access to the file.",
  {
    fileUrl: z.string().describe("Any Figma file URL"),
  },
  async ({ fileUrl }) => {
    const token = getToken();
    const key = parseFileUrl(fileUrl);

    const data = await figmaGet<{
      meta: {
        variables: Record<string, FigmaNode>;
        variableCollections: Record<string, FigmaNode>;
      };
    }>(`/files/${key}/variables/local`, token);

    const collections = Object.values(data.meta.variableCollections);
    const variables = Object.values(data.meta.variables);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          collections: collections.map((c) => ({
            id: c.id,
            name: c.name,
            modes: c.modes,
            defaultModeId: c.defaultModeId,
            variableCount: (c.variableIds as string[] | undefined)?.length ?? 0,
          })),
          variables: variables.map((v) => ({
            id: v.id,
            name: v.name,
            resolvedType: v.resolvedType,
            valuesByMode: v.valuesByMode,
            collectionId: v.variableCollectionId,
            description: v.description,
            hiddenFromPublishing: v.hiddenFromPublishing,
            scopes: v.scopes,
          })),
          totals: { collections: collections.length, variables: variables.length },
        }, null, 2),
      }],
    };
  }
);

// ─── NODE-LEVEL TOOLS ───────────────────────────────────────────────────────

server.tool(
  "get_node_context",
  "Get comprehensive context for a specific Figma node: layout/bounds, auto-layout, fills (with hex colors), strokes, effects (shadows/blurs), typography (for text nodes), corner radius, constraints, component info, and a screenshot URL.",
  {
    nodeUrl: z.string().describe("Figma node selection URL (right-click node → Copy link)"),
    screenshotScale: z
      .number()
      .optional()
      .default(2)
      .describe("Screenshot scale factor (0.5–4, default 2)"),
    screenshotFormat: z
      .enum(["png", "jpg", "svg", "pdf"])
      .optional()
      .default("png")
      .describe("Screenshot format"),
  },
  async ({ nodeUrl, screenshotScale, screenshotFormat }) => {
    const token = getToken();
    const { fileKey, nodeId } = parseNodeUrl(nodeUrl);

    const nodesData = await figmaGet<{ nodes: Record<string, { document: FigmaNode; styles?: FigmaNode }> }>(
      `/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`,
      token
    );
    const imageData = await figmaGet<{ images: Record<string, string> }>(
      `/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=${screenshotFormat}&scale=${screenshotScale}`,
      token
    );

    const entry = nodesData.nodes[nodeId];
    if (!entry) throw new Error(`Node ${nodeId} not found in file ${fileKey}`);

    const doc = entry.document;
    const screenshotUrl = imageData.images[nodeId] ?? null;

    const result = {
      meta: {
        fileKey,
        nodeId,
        name: doc.name,
        type: doc.type,
        visible: doc.visible !== false,
        locked: doc.locked ?? false,
        screenshotUrl,
        screenshotFormat,
        screenshotScale,
      },
      bounds: extractBounds(doc),
      autoLayout: extractAutoLayout(doc),
      fills: extractFills(doc),
      strokes: extractStrokes(doc),
      effects: extractEffects(doc),
      corners: extractCorners(doc),
      constraints: extractConstraints(doc),
      typography: extractTypography(doc),
      componentInfo: extractComponentInfo(doc),
      opacity: doc.opacity ?? 1,
      blendMode: doc.blendMode ?? null,
      exportSettings: doc.exportSettings ?? null,
      referencedStyles: entry.styles ?? null,
      childCount: (doc.children as FigmaNode[] | undefined)?.length ?? 0,
    };

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_node_layers",
  "Get the full layer hierarchy (tree) for a Figma node. Useful for understanding component structure, layer names, and nesting.",
  {
    nodeUrl: z.string().describe("Figma node selection URL"),
    depth: z.number().optional().default(4).describe("Max tree depth (1–8, default 4)"),
    includeStyles: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include fills and typography on each layer"),
  },
  async ({ nodeUrl, depth, includeStyles }) => {
    const token = getToken();
    const { fileKey, nodeId } = parseNodeUrl(nodeUrl);

    const data = await figmaGet<{
      nodes: Record<string, { document: FigmaNode }>;
    }>(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, token);

    const entry = data.nodes[nodeId];
    if (!entry) throw new Error(`Node ${nodeId} not found`);

    const tree = buildLayerTree(entry.document, 0, depth, includeStyles);
    return { content: [{ type: "text", text: JSON.stringify(tree, null, 2) }] };
  }
);

server.tool(
  "get_node_screenshot",
  "Export a Figma node as an image. Returns the CDN URL for the rendered image.",
  {
    nodeUrl: z.string().describe("Figma node selection URL"),
    format: z
      .enum(["png", "jpg", "svg", "pdf"])
      .optional()
      .default("png")
      .describe("Export format"),
    scale: z
      .number()
      .optional()
      .default(2)
      .describe("Scale factor 0.5–4 (default 2 = @2x)"),
    contentsOnly: z
      .boolean()
      .optional()
      .default(true)
      .describe("Crop to node bounds (true) or include surrounding frame (false)"),
  },
  async ({ nodeUrl, format, scale, contentsOnly }) => {
    const token = getToken();
    const { fileKey, nodeId } = parseNodeUrl(nodeUrl);

    const data = await figmaGet<{ images: Record<string, string> }>(
      `/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=${format}&scale=${scale}&contents_only=${contentsOnly}`,
      token
    );

    const url = data.images[nodeId];
    if (!url) throw new Error(`No image generated for node ${nodeId}`);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ nodeId, format, scale, url }, null, 2),
      }],
    };
  }
);

server.tool(
  "get_node_assets",
  "Export multiple Figma nodes as assets (PNG/SVG/JPG/PDF) in a single call. Returns CDN URLs for each node.",
  {
    fileUrl: z.string().describe("Any Figma file URL (used for file key)"),
    nodeIds: z
      .array(z.string())
      .describe("List of node IDs (format: 1234:5678 or 1234-5678)"),
    format: z.enum(["png", "jpg", "svg", "pdf"]).optional().default("png"),
    scale: z.number().optional().default(2).describe("Scale 0.5–4"),
  },
  async ({ fileUrl, nodeIds, format, scale }) => {
    const token = getToken();
    const key = parseFileUrl(fileUrl);

    const normalizedIds = nodeIds.map((id) => id.replace(/-/, ":"));
    const idsParam = normalizedIds.map(encodeURIComponent).join(",");

    const data = await figmaGet<{ images: Record<string, string>; err?: string }>(
      `/images/${key}?ids=${idsParam}&format=${format}&scale=${scale}`,
      token
    );

    const assets = normalizedIds.map((id) => ({
      nodeId: id,
      url: data.images[id] ?? null,
    }));

    return { content: [{ type: "text", text: JSON.stringify({ assets, format, scale }, null, 2) }] };
  }
);

server.tool(
  "get_node_text_content",
  "Extract all text content from a Figma node and its children. Returns each text layer with its value, typography properties, and position.",
  {
    nodeUrl: z.string().describe("Figma node selection URL"),
  },
  async ({ nodeUrl }) => {
    const token = getToken();
    const { fileKey, nodeId } = parseNodeUrl(nodeUrl);

    const data = await figmaGet<{
      nodes: Record<string, { document: FigmaNode }>;
    }>(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, token);

    const entry = data.nodes[nodeId];
    if (!entry) throw new Error(`Node ${nodeId} not found`);

    const textNodes = collectTextNodes(entry.document);
    const result = textNodes.map((n) => ({
      id: n.id,
      name: n.name,
      characters: n.characters,
      bounds: extractBounds(n),
      typography: extractTypography(n),
      fills: extractFills(n),
      visible: n.visible !== false,
    }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ count: result.length, textNodes: result }, null, 2),
      }],
    };
  }
);

server.tool(
  "get_node_colors",
  "Extract all unique colors (fills) used in a Figma node subtree. Returns hex values and usage count.",
  {
    nodeUrl: z.string().describe("Figma node selection URL"),
  },
  async ({ nodeUrl }) => {
    const token = getToken();
    const { fileKey, nodeId } = parseNodeUrl(nodeUrl);

    const data = await figmaGet<{
      nodes: Record<string, { document: FigmaNode }>;
    }>(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, token);

    const entry = data.nodes[nodeId];
    if (!entry) throw new Error(`Node ${nodeId} not found`);

    const colors = collectColors(entry.document);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ count: colors.length, colors }, null, 2),
      }],
    };
  }
);

server.tool(
  "get_node_spacing",
  "Analyze spacing and layout properties in a Figma node: auto-layout padding, gap, sizing modes, and constraints for every layer.",
  {
    nodeUrl: z.string().describe("Figma node selection URL"),
    depth: z.number().optional().default(3).describe("Depth to analyze (default 3)"),
  },
  async ({ nodeUrl, depth }) => {
    const token = getToken();
    const { fileKey, nodeId } = parseNodeUrl(nodeUrl);

    const data = await figmaGet<{
      nodes: Record<string, { document: FigmaNode }>;
    }>(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`, token);

    const entry = data.nodes[nodeId];
    if (!entry) throw new Error(`Node ${nodeId} not found`);

    const spacingNodes: unknown[] = [];
    traverseNodes(
      entry.document,
      (n) => {
        const al = extractAutoLayout(n);
        const hasLayout = !!al || n.constraints != null;
        if (hasLayout) {
          spacingNodes.push({
            id: n.id,
            name: n.name,
            type: n.type,
            bounds: extractBounds(n),
            autoLayout: al,
            constraints: extractConstraints(n),
            layoutAlign: n.layoutAlign ?? null,
            layoutGrow: n.layoutGrow ?? null,
          });
        }
        return false;
      },
      [],
      200
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ count: spacingNodes.length, nodes: spacingNodes }, null, 2),
      }],
    };
  }
);

// ─── COMPONENT TOOLS ─────────────────────────────────────────────────────────

server.tool(
  "get_component",
  "Get detailed info for a specific component: description, documentation links, properties, and the rendered node structure.",
  {
    componentKey: z.string().describe("Component key (from get_file_components result)"),
  },
  async ({ componentKey }) => {
    const token = getToken();
    const data = await figmaGet<{
      meta: {
        key: string;
        name: string;
        description: string;
        document_url: string;
        created_at: string;
        updated_at: string;
        containing_frame: FigmaNode;
        containing_page: FigmaNode;
      };
    }>(`/components/${componentKey}`, token);

    return { content: [{ type: "text", text: JSON.stringify(data.meta, null, 2) }] };
  }
);

server.tool(
  "get_component_set",
  "Get details for a component set (variants group), including all variant properties and their values.",
  {
    componentSetKey: z.string().describe("Component set key (from get_file_components result)"),
  },
  async ({ componentSetKey }) => {
    const token = getToken();
    const data = await figmaGet<{ meta: FigmaNode }>(`/component_sets/${componentSetKey}`, token);
    return { content: [{ type: "text", text: JSON.stringify(data.meta, null, 2) }] };
  }
);

// ─── SEARCH TOOL ─────────────────────────────────────────────────────────────

server.tool(
  "search_nodes",
  "Search for nodes by name or type within a Figma file or node subtree. Returns matching nodes with their IDs, bounds, and parent info.",
  {
    fileUrl: z.string().describe("Any Figma file URL"),
    query: z.string().optional().describe("Name search (case-insensitive substring match)"),
    nodeType: z
      .enum([
        "FRAME", "GROUP", "COMPONENT", "COMPONENT_SET", "INSTANCE",
        "TEXT", "RECTANGLE", "ELLIPSE", "VECTOR", "BOOLEAN_OPERATION",
        "SECTION", "SLICE",
      ])
      .optional()
      .describe("Filter by node type"),
    pageName: z.string().optional().describe("Limit search to a specific page"),
    limit: z.number().optional().default(50).describe("Max results (default 50)"),
  },
  async ({ fileUrl, query, nodeType, pageName, limit }) => {
    const token = getToken();
    const key = parseFileUrl(fileUrl);

    const data = await figmaGet<{
      document: { children: FigmaNode[] };
    }>(`/files/${key}?depth=5`, token);

    let searchRoot: FigmaNode;
    if (pageName) {
      const page = data.document.children.find(
        (p) => (p.name as string).toLowerCase() === pageName.toLowerCase()
      );
      if (!page) {
        const names = data.document.children.map((p) => p.name).join(", ");
        throw new Error(`Page "${pageName}" not found. Pages: ${names}`);
      }
      searchRoot = page;
    } else {
      searchRoot = { id: "ROOT", name: "Document", type: "DOCUMENT", children: data.document.children };
    }

    const results = traverseNodes(
      searchRoot,
      (n) => {
        const nameMatch = query
          ? (n.name as string).toLowerCase().includes(query.toLowerCase())
          : true;
        const typeMatch = nodeType ? n.type === nodeType : true;
        return nameMatch && typeMatch;
      },
      [],
      limit
    );

    const formatted = results.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      visible: n.visible !== false,
      bounds: extractBounds(n),
      ...(n.componentId ? { componentId: n.componentId } : {}),
      ...(n.characters ? { text: n.characters } : {}),
    }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ count: formatted.length, results: formatted }, null, 2),
      }],
    };
  }
);

// ─── COMMENTS TOOL ───────────────────────────────────────────────────────────

server.tool(
  "get_file_comments",
  "Get all comments and annotations on a Figma file.",
  {
    fileUrl: z.string().describe("Any Figma file URL"),
  },
  async ({ fileUrl }) => {
    const token = getToken();
    const key = parseFileUrl(fileUrl);

    const data = await figmaGet<{
      comments: Array<{
        id: string;
        message: string;
        created_at: string;
        resolved_at: string | null;
        client_meta: unknown;
        user: { id: string; handle: string; img_url: string };
      }>;
    }>(`/files/${key}/comments`, token);

    return { content: [{ type: "text", text: JSON.stringify(data.comments, null, 2) }] };
  }
);

// ─── BOOT ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Figma server v2 running — 15 tools available");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
