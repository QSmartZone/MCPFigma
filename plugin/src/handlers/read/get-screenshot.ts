/**
 * get_screenshot handler — exports nodes to base64-encoded images.
 * Supports multiple formats (PNG, JPG, SVG, PDF) with optional scale.
 */

import { Handler } from "../../dispatcher";

export const handleGetScreenshot: Handler = async (params: any) => {
  const format = params.params?.format ?? "PNG";
  const scale = params.params?.scale ?? 2;
  const nodeIds = params.nodeIds || [];

  let targetNodes: any[] = [];

  // If nodeIds provided, fetch those nodes
  if (nodeIds.length > 0) {
    const nodes = await Promise.all(
      nodeIds.map((id: string) => figma.getNodeByIdAsync(id)),
    );
    targetNodes = nodes.filter(
      (n: any) => n !== null && n.type !== "DOCUMENT" && n.type !== "PAGE",
    );
  } else {
    // Otherwise use current selection
    targetNodes = figma.currentPage.selection.slice();
  }

  if (targetNodes.length === 0) {
    throw new Error("No nodes to export. Select nodes or provide nodeIds.");
  }

  // Export each node
  const formatSettings: { [key: string]: any } = {
    SVG: { format: "SVG" },
    PDF: { format: "PDF" },
    JPG: { format: "JPG", constraint: { type: "SCALE", value: scale } },
    PNG: { format: "PNG", constraint: { type: "SCALE", value: scale } },
  };

  const exports: any[] = await Promise.all(
    targetNodes.map(async (node: any) => {
      const settings = formatSettings[format] || formatSettings.PNG;
      const bytes = await node.exportAsync(settings);
      const base64 = figma.base64Encode(bytes);

      return {
        nodeId: node.id,
        nodeName: node.name,
        format,
        base64,
        width: node.width,
        height: node.height,
      };
    }),
  );

  return {
    exports,
  };
};
