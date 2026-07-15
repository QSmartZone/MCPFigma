/**
 * set_constraints handler — sets constraints on multiple nodes.
 */

import { Handler } from "../../dispatcher";

export const handleSetConstraints: Handler = async (params: any) => {
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

    if (!("constraints" in n)) {
      results.push({ nodeId: nid, error: "Node does not support constraints" });
      continue;
    }

    // Create a copy of existing constraints and update with new values
    const updated = { ...n.constraints };
    if (p.horizontal) {
      updated.horizontal = p.horizontal;
    }
    if (p.vertical) {
      updated.vertical = p.vertical;
    }

    n.constraints = updated;
    results.push({ nodeId: nid, constraints: n.constraints });
  }

  figma.commitUndo();

  return { results };
};
