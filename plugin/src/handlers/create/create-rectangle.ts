/**
 * create_rectangle handler — creates a new rectangle with optional fill and corner radius.
 */

import { Handler } from "../../dispatcher";
import { getBounds } from "../../serialize";
import { getParentNode, makeSolidPaint } from "./helpers";

export const handleCreateRectangle: Handler = async (params: any) => {
  const p = params.params || {};
  const parent = await getParentNode(p.parentId);

  const rect = figma.createRectangle();
  rect.resize(p.width || 100, p.height || 100);
  rect.x = p.x != null ? p.x : 0;
  rect.y = p.y != null ? p.y : 0;

  if (p.name) {
    rect.name = p.name;
  }

  if (p.fillColor) {
    rect.fills = [makeSolidPaint(p.fillColor)];
  }

  if (p.cornerRadius != null) {
    rect.cornerRadius = p.cornerRadius;
  }

  parent.appendChild(rect);
  figma.commitUndo();

  return {
    id: rect.id,
    name: rect.name,
    type: rect.type,
    bounds: getBounds(rect),
  };
};
