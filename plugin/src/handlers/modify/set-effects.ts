/**
 * set_effects handler — sets effects (shadows, blurs) on a node.
 */

import { Handler } from "../../dispatcher";
import { hexToRgb } from "../create/helpers";

export const handleSetEffects: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeIds = params.nodeIds || [];

  if (nodeIds.length === 0) {
    throw new Error("nodeIds is required");
  }

  if (!Array.isArray(p.effects)) {
    throw new Error("effects array is required");
  }

  const nodeId = nodeIds[0];
  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (!("effects" in node)) {
    throw new Error(`Node ${nodeId} does not support effects`);
  }

  // Transform input effects into Figma effect objects
  const effects: any[] = p.effects.map((e: any) => {
    switch (e.type) {
      case "DROP_SHADOW":
      case "INNER_SHADOW": {
        const { r, g, b } = hexToRgb(e.color || "#000000");
        return {
          type: e.type,
          color: {
            r,
            g,
            b,
            a: e.opacity != null ? Number(e.opacity) : 0.25,
          },
          offset: {
            x: Number(e.offsetX != null ? e.offsetX : 0),
            y: Number(e.offsetY != null ? e.offsetY : 4),
          },
          radius: Number(e.radius != null ? e.radius : 4),
          spread: Number(e.spread != null ? e.spread : 0),
          visible: e.visible != null ? e.visible : true,
          blendMode: e.blendMode || "NORMAL",
        };
      }
      case "LAYER_BLUR":
      case "BACKGROUND_BLUR":
        return {
          type: e.type,
          radius: Number(e.radius != null ? e.radius : 4),
          visible: e.visible != null ? e.visible : true,
        };
      default:
        throw new Error(
          `Unknown effect type: ${e.type}. Must be DROP_SHADOW, INNER_SHADOW, LAYER_BLUR, or BACKGROUND_BLUR`,
        );
    }
  });

  node.effects = effects;

  figma.commitUndo();

  return {
    id: node.id,
    name: node.name,
    effectCount: effects.length,
  };
};
