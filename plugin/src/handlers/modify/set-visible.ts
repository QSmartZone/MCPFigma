/**
 * set_visible handler — sets visibility on multiple nodes.
 */

import { Handler } from "../../dispatcher";

export const handleSetVisible: Handler = async (params: any) => {
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

    if (!("visible" in n)) {
      results.push({ nodeId: nid, error: "Node does not support visibility" });
      continue;
    }

    n.visible = p.visible;
    results.push({ nodeId: nid, visible: n.visible });
  }

  figma.commitUndo();

  return { results };
};
