/**
 * bind_variable_to_node handler — binds a variable to a node property.
 * Handles special cases for fillColor and strokeColor paint binding.
 */

import { Handler } from "../../dispatcher";
import { makeSolidPaint } from "../create/helpers";

export const handleBindVariableToNode: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeIds = params.nodeIds || [];

  const nodeId = nodeIds[0];
  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  if (!p.variableId) {
    throw new Error("variableId is required");
  }

  if (!p.field) {
    throw new Error("field is required");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const variable = await figma.variables.getVariableByIdAsync(p.variableId);
  if (!variable) {
    throw new Error(`Variable not found: ${p.variableId}`);
  }

  const n = node as any;

  if (p.field === "fillColor") {
    if (!("fills" in node)) {
      throw new Error(`Node ${nodeId} does not support fills`);
    }

    const fills = [...(n.fills || [])];
    const base = fills.length > 0 ? fills[0] : makeSolidPaint("#000000");
    const paint = figma.variables.setBoundVariableForPaint(
      base,
      "color",
      variable,
    );
    n.fills = [paint];
  } else if (p.field === "strokeColor") {
    if (!("strokes" in node)) {
      throw new Error(`Node ${nodeId} does not support strokes`);
    }

    const strokes = [...(n.strokes || [])];
    const base = strokes.length > 0 ? strokes[0] : makeSolidPaint("#000000");
    const paint = figma.variables.setBoundVariableForPaint(
      base,
      "color",
      variable,
    );
    n.strokes = [paint];
  } else {
    if (!(p.field in node)) {
      throw new Error(`Node ${nodeId} does not have field: ${p.field}`);
    }

    n.setBoundVariable(p.field, variable);
  }

  figma.commitUndo();

  return {
    id: node.id,
    name: node.name,
    variableId: p.variableId,
    field: p.field,
  };
};
