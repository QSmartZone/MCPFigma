/**
 * resize_nodes handler — resizes nodes to a specified width and height.
 */

import { Handler } from "../../dispatcher";

export const handleResizeNodes: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeIds = params.nodeIds || [];

  if (nodeIds.length === 0) {
    throw new Error("nodeIds is required");
  }

  const results: any[] = [];

  for (const nid of nodeIds) {
    const n = await figma.getNodeByIdAsync(nid);

    if (!n) {
      results.push({ nodeId: nid, error: "Node not found" });
      continue;
    }

    if (!("resize" in n)) {
      results.push({ nodeId: nid, error: "Node does not support resize" });
      continue;
    }

    const w = p.width != null ? p.width : n.width;
    const h = p.height != null ? p.height : n.height;
    n.resize(w, h);
    results.push({ nodeId: nid, width: n.width, height: n.height });
  }

  figma.commitUndo();

  return { results };
};
