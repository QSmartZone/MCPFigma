/**
 * set_corner_radius handler — sets corner radius properties on multiple nodes.
 */

import { Handler } from "../../dispatcher";

export const handleSetCornerRadius: Handler = async (params: any) => {
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

    if (!("cornerRadius" in n)) {
      results.push({
        nodeId: nid,
        error: "Node does not support corner radius",
      });
      continue;
    }

    // Set individual corner radii if provided
    if (p.cornerRadius != null) {
      n.cornerRadius = p.cornerRadius;
    }
    if (p.topLeftRadius != null) {
      n.topLeftRadius = p.topLeftRadius;
    }
    if (p.topRightRadius != null) {
      n.topRightRadius = p.topRightRadius;
    }
    if (p.bottomLeftRadius != null) {
      n.bottomLeftRadius = p.bottomLeftRadius;
    }
    if (p.bottomRightRadius != null) {
      n.bottomRightRadius = p.bottomRightRadius;
    }

    results.push({ nodeId: nid, cornerRadius: n.cornerRadius });
  }

  figma.commitUndo();

  return { results };
};
