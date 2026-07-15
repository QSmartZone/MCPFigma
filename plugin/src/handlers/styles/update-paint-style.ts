/**
 * update_paint_style handler — updates an existing paint style.
 */

import { Handler } from "../../dispatcher";
import { makeSolidPaint } from "../create/helpers";

export const handleUpdatePaintStyle: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.styleId) {
    throw new Error("styleId is required");
  }

  const style = await figma.getStyleByIdAsync(p.styleId);

  if (!style) {
    throw new Error(`Style not found: ${p.styleId}`);
  }

  if (style.type !== "PAINT") {
    throw new Error(`Style ${p.styleId} is not a paint style`);
  }

  if (p.name) {
    style.name = p.name;
  }

  if (p.color) {
    style.paints = [makeSolidPaint(p.color)];
  }

  if (p.description != null) {
    style.description = p.description;
  }

  figma.commitUndo();

  return {
    id: style.id,
    name: style.name,
  };
};
