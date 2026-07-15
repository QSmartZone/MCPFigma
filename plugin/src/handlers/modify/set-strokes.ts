/**
 * set_strokes handler — sets or appends stroke color and weight to a node.
 */

import { Handler } from "../../dispatcher";
import { makeSolidPaint } from "../create/helpers";

export const handleSetStrokes: Handler = async (params: any) => {
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

  if (!("strokes" in node)) {
    throw new Error(`Node ${nodeId} does not support strokes`);
  }

  const newStroke = makeSolidPaint(p.color);

  // If mode is "append", add to existing strokes; otherwise replace
  node.strokes =
    p.mode === "append" ? [...node.strokes, newStroke] : [newStroke];

  if (p.strokeWeight != null) {
    node.strokeWeight = p.strokeWeight;
  }

  figma.commitUndo();

  return {
    id: node.id,
    name: node.name,
  };
};
