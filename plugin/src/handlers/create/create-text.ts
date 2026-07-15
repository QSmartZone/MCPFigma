/**
 * create_text handler — creates a new text node with optional fill.
 * CRITICAL: loadFontAsync must be called BEFORE setting fontName and characters.
 */

import { Handler } from "../../dispatcher";
import { getBounds } from "../../serialize";
import { getParentNode, makeSolidPaint } from "./helpers";

export const handleCreateText: Handler = async (params: any) => {
  const p = params.params || {};
  const parent = await getParentNode(p.parentId);

  const fontFamily = p.fontFamily || "Inter";
  const fontStyle = p.fontStyle || "Regular";

  // Load font FIRST, before setting fontName
  await figma.loadFontAsync({ family: fontFamily, style: fontStyle });

  const textNode = figma.createText();
  textNode.fontName = { family: fontFamily, style: fontStyle };

  if (p.fontSize != null) {
    textNode.fontSize = Number(p.fontSize);
  }

  textNode.characters = p.text || "";
  textNode.x = p.x != null ? p.x : 0;
  textNode.y = p.y != null ? p.y : 0;

  if (p.name) {
    textNode.name = p.name;
  }

  if (p.fillColor) {
    textNode.fills = [makeSolidPaint(p.fillColor)];
  }

  parent.appendChild(textNode);
  figma.commitUndo();

  return {
    id: textNode.id,
    name: textNode.name,
    type: textNode.type,
    bounds: getBounds(textNode),
  };
};
