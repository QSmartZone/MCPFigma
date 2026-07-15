/**
 * create_text_style handler — creates a new text style with font and typography settings.
 */

import { Handler } from "../../dispatcher";

export const handleCreateTextStyle: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.name) {
    throw new Error("name is required");
  }

  const existing = await figma.getLocalTextStylesAsync();
  const found = existing.find((s) => s.name === p.name);

  if (found) {
    return {
      id: found.id,
      name: found.name,
    };
  }

  const family = p.fontFamily || "Inter";
  const fontStyle = p.fontStyle || "Regular";

  // Load the font before creating the style
  await figma.loadFontAsync({ family, style: fontStyle });

  const style = figma.createTextStyle();
  style.name = p.name;
  style.fontName = { family, style: fontStyle };

  if (p.fontSize != null) {
    style.fontSize = Number(p.fontSize);
  }

  if (p.description) {
    style.description = p.description;
  }

  if (p.textDecoration && p.textDecoration !== "NONE") {
    style.textDecoration = p.textDecoration;
  }

  if (p.lineHeightValue != null) {
    style.lineHeight = {
      value: Number(p.lineHeightValue),
      unit: p.lineHeightUnit || "PIXELS",
    };
  }

  if (p.letterSpacingValue != null) {
    style.letterSpacing = {
      value: Number(p.letterSpacingValue),
      unit: p.letterSpacingUnit || "PIXELS",
    };
  }

  figma.commitUndo();

  return {
    id: style.id,
    name: style.name,
  };
};
