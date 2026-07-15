/**
 * delete_nodes handler — deletes nodes from the document.
 */

import { Handler } from "../../dispatcher";

export const handleDeleteNodes: Handler = async (params: any) => {
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

    n.remove();
    results.push({ nodeId: nid, deleted: true });
  }

  figma.commitUndo();

  return { results };
};
