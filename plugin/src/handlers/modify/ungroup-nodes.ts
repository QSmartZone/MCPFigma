/**
 * ungroup_nodes handler — ungroups grouped nodes.
 */

import { Handler } from "../../dispatcher";

export const handleUngroupNodes: Handler = async (params: any) => {
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

    if (n.type !== "GROUP") {
      results.push({ nodeId: nid, error: "Node is not a GROUP" });
      continue;
    }

    const group = n as GroupNode;
    const parent = group.parent;
    if (!parent) {
      results.push({ nodeId: nid, error: "Group has no parent" });
      continue;
    }

    const index = parent.children.indexOf(group);
    const childIds = [];

    for (const child of [...group.children]) {
      parent.insertChild(index, child);
      childIds.push(child.id);
    }

    group.remove();
    results.push({ nodeId: nid, childIds });
  }

  figma.commitUndo();

  return { results };
};
