/**
 * set_blend_mode handler — sets blend mode on multiple nodes.
 */

import { Handler } from "../../dispatcher";

export const handleSetBlendMode: Handler = async (params: any) => {
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

    if (!("blendMode" in n)) {
      results.push({ nodeId: nid, error: "Node does not support blend mode" });
      continue;
    }

    n.blendMode = p.blendMode;
    results.push({ nodeId: nid, blendMode: n.blendMode });
  }

  figma.commitUndo();

  return { results };
};
