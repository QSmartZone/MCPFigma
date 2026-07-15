/**
 * create_frame handler — creates a new frame with optional fill and auto layout.
 */

import { Handler } from "../../dispatcher";
import { getBounds } from "../../serialize";
import { getParentNode, makeSolidPaint, applyAutoLayout } from "./helpers";

export const handleCreateFrame: Handler = async (params: any) => {
  const p = params.params || {};
  const parent = await getParentNode(p.parentId);

  const frame = figma.createFrame();
  frame.resize(p.width || 100, p.height || 100);
  frame.x = p.x != null ? p.x : 0;
  frame.y = p.y != null ? p.y : 0;

  if (p.name) {
    frame.name = p.name;
  }

  if (p.fillColor) {
    frame.fills = [makeSolidPaint(p.fillColor)];
  }

  applyAutoLayout(frame, p);
  parent.appendChild(frame);
  figma.commitUndo();

  return {
    id: frame.id,
    name: frame.name,
    type: frame.type,
    bounds: getBounds(frame),
  };
};
