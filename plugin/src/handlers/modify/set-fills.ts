/**
 * set_fills handler — sets or appends fill color to a node.
 */

import { Handler } from "../../dispatcher";
import { makeSolidPaint } from "../create/helpers";

export const handleSetFills: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeIds = params.nodeIds || [];

  if (nodeIds.length === 0) {
    throw new Error("nodeIds is required");
  }

  const nodeId = nodeIds[0];
  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (!("fills" in node)) {
    throw new Error(`Node ${nodeId} does not support fills`);
  }

  const newFill = makeSolidPaint(
    p.color,
    p.opacity != null ? p.opacity : undefined,
  );

  // If mode is "append", add to existing fills; otherwise replace
  node.fills = p.mode === "append" ? [...node.fills, newFill] : [newFill];

  figma.commitUndo();

  return {
    id: node.id,
    name: node.name,
  };
};
