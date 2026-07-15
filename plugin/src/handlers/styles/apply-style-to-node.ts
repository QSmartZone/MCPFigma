/**
 * apply_style_to_node handler — applies a style to a node using async setters.
 * Dispatches based on the style type (PAINT, TEXT, EFFECT, GRID).
 */

import { Handler } from "../../dispatcher";

export const handleApplyStyleToNode: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeIds = params.nodeIds || [];

  const nodeId = nodeIds[0];
  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  if (!p.styleId) {
    throw new Error("styleId is required");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const style = await figma.getStyleByIdAsync(p.styleId);
  if (!style) {
    throw new Error(`Style not found: ${p.styleId}`);
  }

  const n = node as any;

  switch (style.type) {
    case "PAINT": {
      const target = p.target || "fill";
      if (target === "stroke") {
        if (!("strokeStyleId" in node)) {
          throw new Error(`Node ${nodeId} does not support stroke styles`);
        }
        await n.setStrokeStyleIdAsync(p.styleId);
      } else {
        if (!("fillStyleId" in node)) {
          throw new Error(`Node ${nodeId} does not support fill styles`);
        }
        await n.setFillStyleIdAsync(p.styleId);
      }
      break;
    }

    case "TEXT": {
      if (!("textStyleId" in node)) {
        throw new Error(`Node ${nodeId} does not support text styles`);
      }
      await n.setTextStyleIdAsync(p.styleId);
      break;
    }

    case "EFFECT": {
      if (!("effectStyleId" in node)) {
        throw new Error(`Node ${nodeId} does not support effect styles`);
      }
      await n.setEffectStyleIdAsync(p.styleId);
      break;
    }

    case "GRID": {
      if (!("gridStyleId" in node)) {
        throw new Error(`Node ${nodeId} does not support grid styles`);
      }
      await n.setGridStyleIdAsync(p.styleId);
      break;
    }

    default:
      throw new Error(`Unknown style type: ${style.type}`);
  }

  figma.commitUndo();

  return {
    id: n.id,
    name: n.name,
    styleId: p.styleId,
    styleType: style.type,
  };
};
