/**
 * set_opacity handler — sets opacity on multiple nodes.
 */

import { Handler } from "../../dispatcher";

export const handleSetOpacity: Handler = async (params: any) => {
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

    if (!("opacity" in n)) {
      results.push({ nodeId: nid, error: "Node does not support opacity" });
      continue;
    }

    n.opacity = p.opacity;
    results.push({ nodeId: nid, opacity: n.opacity });
  }

  figma.commitUndo();

  return { results };
};
