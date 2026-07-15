/**
 * create_paint_style handler — creates a new paint style with solid color.
 */

import { Handler } from "../../dispatcher";
import { makeSolidPaint } from "../create/helpers";

export const handleCreatePaintStyle: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.name) {
    throw new Error("name is required");
  }

  if (!p.color) {
    throw new Error("color is required");
  }

  const existing = await figma.getLocalPaintStylesAsync();
  const found = existing.find((s) => s.name === p.name);

  if (found) {
    return {
      id: found.id,
      name: found.name,
    };
  }

  const style = figma.createPaintStyle();
  style.name = p.name;
  style.paints = [makeSolidPaint(p.color)];

  if (p.description) {
    style.description = p.description;
  }

  figma.commitUndo();

  return {
    id: style.id,
    name: style.name,
  };
};
