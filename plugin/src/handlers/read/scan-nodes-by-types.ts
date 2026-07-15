/**
 * scan_nodes_by_types handler — scans a node and its children for nodes matching given types.
 * Emits progress updates during scanning.
 */

import { Handler } from "../../dispatcher";

export const handleScanNodesByTypes: Handler = async (params: any) => {
  const nodeId = params.params?.nodeId;
  const types = params.params?.types ?? [];

  if (!nodeId) {
    throw new Error("nodeId is required for scan_nodes_by_types");
  }

  if (types.length === 0) {
    throw new Error("types must be a non-empty array");
  }

  const root = await figma.getNodeByIdAsync(nodeId);

  if (!root) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const matchingNodes: any[] = [];

  // Emit initial progress update
  figma.ui.postMessage({
    type: "progress_update",
    requestId: params.requestId,
    progress: 10,
    message: `Scanning for types: ${types.join(", ")}...`,
  });

  await new Promise((r) => setTimeout(r, 0));

  // Recursive function to find nodes by types
  async function findByTypes(n: any): Promise<void> {
    // Skip hidden nodes
    if ("visible" in n && !n.visible) {
      return;
    }

    if (types.includes(n.type)) {
      matchingNodes.push({
        id: n.id,
        name: n.name,
        type: n.type,
        bbox: {
          x: "x" in n ? n.x : 0,
          y: "y" in n ? n.y : 0,
          width: "width" in n ? n.width : 0,
          height: "height" in n ? n.height : 0,
        },
      });
    }

    if ("children" in n) {
      for (const child of n.children) {
        await findByTypes(child);
      }
    }
  }

  await findByTypes(root);

  return {
    count: matchingNodes.length,
    matchingNodes,
    searchedTypes: types,
  };
};
