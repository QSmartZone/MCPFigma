/**
 * unlock_nodes handler — unlocks nodes to allow editing.
 */

import { Handler } from "../../dispatcher";

export const handleUnlockNodes: Handler = async (params: any) => {
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

    if (!("locked" in n)) {
      results.push({ nodeId: nid, error: "Node does not support locking" });
      continue;
    }

    n.locked = false;
    results.push({ nodeId: nid, locked: n.locked });
  }

  figma.commitUndo();

  return { results };
};
