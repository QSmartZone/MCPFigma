/**
 * move_nodes handler — moves nodes to a specified position.
 */

import { Handler } from "../../dispatcher";

export const handleMoveNodes: Handler = async (params: any) => {
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

    if (!("x" in n)) {
      results.push({ nodeId: nid, error: "Node does not support position" });
      continue;
    }

    if (p.x != null) n.x = p.x;
    if (p.y != null) n.y = p.y;
    results.push({ nodeId: nid, x: n.x, y: n.y });
  }

  figma.commitUndo();

  return { results };
};
