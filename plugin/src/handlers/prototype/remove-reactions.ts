/**
 * remove_reactions handler — removes reactions from a node.
 */

import { Handler } from "../../dispatcher";
import { parseArray, setReactions } from "./helpers";

export const handleRemoveReactions: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeId = params.nodeIds && params.nodeIds[0];

  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (!("reactions" in node)) {
    throw new Error(`Node ${nodeId} does not support reactions`);
  }

  const current = (node as any).reactions;
  let updated: any[];

  if (p.indices == null) {
    updated = [];
  } else {
    const indices = parseArray(p.indices);
    if (indices.length === 0) {
      updated = [];
    } else {
      const toRemove = new Set(indices);
      updated = current.filter((_: any, i: number) => !toRemove.has(i));
    }
  }

  await setReactions(node, updated);

  figma.commitUndo();

  return {
    id: node.id,
    name: node.name,
    removed: current.length - updated.length,
    reactionCount: updated.length,
  };
};
