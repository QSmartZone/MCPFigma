/**
 * create_ellipse handler — creates a new ellipse with optional fill.
 */

import { Handler } from "../../dispatcher";
import { getBounds } from "../../serialize";
import { getParentNode, makeSolidPaint } from "./helpers";

export const handleCreateEllipse: Handler = async (params: any) => {
  const p = params.params || {};
  const parent = await getParentNode(p.parentId);

  const ellipse = figma.createEllipse();
  ellipse.resize(p.width || 100, p.height || 100);
  ellipse.x = p.x != null ? p.x : 0;
  ellipse.y = p.y != null ? p.y : 0;

  if (p.name) {
    ellipse.name = p.name;
  }

  if (p.fillColor) {
    ellipse.fills = [makeSolidPaint(p.fillColor)];
  }

  parent.appendChild(ellipse);
  figma.commitUndo();

  return {
    id: ellipse.id,
    name: ellipse.name,
    type: ellipse.type,
    bounds: getBounds(ellipse),
  };
};
