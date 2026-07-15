/**
 * rotate_nodes handler — rotates nodes by a specified angle.
 */

import { Handler } from "../../dispatcher";

export const handleRotateNodes: Handler = async (params: any) => {
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

    if (!("rotation" in n)) {
      results.push({ nodeId: nid, error: "Node does not support rotation" });
      continue;
    }

    n.rotation = p.rotation;
    results.push({ nodeId: nid, rotation: n.rotation });
  }

  figma.commitUndo();

  return { results };
};
