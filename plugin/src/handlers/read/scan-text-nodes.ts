/**
 * scan_text_nodes handler — scans a node and its children for text nodes.
 * Emits progress updates during scanning.
 */

import { Handler } from "../../dispatcher";
import { isMixed } from "../../serialize";

export const handleScanTextNodes: Handler = async (params: any) => {
  const nodeId = params.params?.nodeId;

  if (!nodeId) {
    throw new Error("nodeId is required for scan_text_nodes");
  }

  const root = await figma.getNodeByIdAsync(nodeId);

  if (!root) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const textNodes: any[] = [];

  // Emit initial progress update
  figma.ui.postMessage({
    type: "progress_update",
    requestId: params.requestId,
    progress: 10,
    message: "Scanning text nodes...",
  });

  await new Promise((r) => setTimeout(r, 0));

  // Recursive function to find text nodes
  async function findText(n: any): Promise<void> {
    if (n.type === "TEXT") {
      textNodes.push({
        id: n.id,
        name: n.name,
        characters: n.characters,
        fontSize: isMixed(n.fontSize) ? "mixed" : n.fontSize,
        fontName: isMixed(n.fontName) ? "mixed" : n.fontName,
      });
    }

    if ("children" in n) {
      for (const child of n.children) {
        await findText(child);
      }
    }
  }

  await findText(root);

  return {
    count: textNodes.length,
    textNodes,
  };
};
