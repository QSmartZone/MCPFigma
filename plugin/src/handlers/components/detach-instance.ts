/**
 * detach_instance handler — detaches a component instance, converting it to a standalone frame.
 */

import { Handler } from "../../dispatcher";

export const handleDetachInstance: Handler = async (params: any) => {
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

    if (n.type !== "INSTANCE") {
      results.push({ nodeId: nid, error: "Node is not an INSTANCE" });
      continue;
    }

    const frame = (n as any).detachInstance();
    results.push({ nodeId: nid, newId: frame.id, name: frame.name });
  }

  figma.commitUndo();

  return { results };
};
