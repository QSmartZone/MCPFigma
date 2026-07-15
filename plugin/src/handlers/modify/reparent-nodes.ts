/**
 * reparent_nodes handler — moves nodes to a new parent.
 */

import { Handler } from "../../dispatcher";

export const handleReparentNodes: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeIds = params.nodeIds || [];

  if (nodeIds.length === 0) {
    throw new Error("nodeIds is required");
  }

  if (!p.parentId) {
    throw new Error("parentId is required");
  }

  const newParent = await figma.getNodeByIdAsync(p.parentId);
  if (!newParent) {
    throw new Error(`Parent not found: ${p.parentId}`);
  }

  if (!("appendChild" in newParent)) {
    throw new Error(`Node ${p.parentId} cannot contain children`);
  }

  const results: any[] = [];

  for (const nid of nodeIds) {
    const n = await figma.getNodeByIdAsync(nid);

    if (!n) {
      results.push({ nodeId: nid, error: "Node not found" });
      continue;
    }

    try {
      (newParent as any).appendChild(n as SceneNode);
      results.push({ nodeId: nid, newParentId: p.parentId });
    } catch (e) {
      results.push({ nodeId: nid, error: (e as any).message });
    }
  }

  figma.commitUndo();

  return { results };
};
