/**
 * clone_node handler — clones a node and optionally positions it.
 */

import { Handler } from "../../dispatcher";
import { getBounds } from "../../serialize";

export const handleCloneNode: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeId = params.nodeIds && params.nodeIds[0];

  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const clone = (node as any).clone();

  if (p.x != null) clone.x = p.x;
  if (p.y != null) clone.y = p.y;

  if (p.parentId) {
    const parent = await figma.getNodeByIdAsync(p.parentId);
    if (!parent) {
      throw new Error(`Parent not found: ${p.parentId}`);
    }
    if (!("appendChild" in parent)) {
      throw new Error(`Node ${p.parentId} cannot contain children`);
    }
    parent.appendChild(clone);
  }

  figma.commitUndo();

  return {
    id: clone.id,
    name: clone.name,
    type: clone.type,
    bounds: getBounds(clone),
  };
};
