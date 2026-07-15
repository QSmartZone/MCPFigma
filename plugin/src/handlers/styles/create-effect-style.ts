/**
 * create_effect_style handler — creates a new effect style (shadow, blur, etc.).
 */

import { Handler } from "../../dispatcher";
import { hexToRgb } from "../create/helpers";

export const handleCreateEffectStyle: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.name) {
    throw new Error("name is required");
  }

  const existing = await figma.getLocalEffectStylesAsync();
  const found = existing.find((s) => s.name === p.name);

  if (found) {
    return {
      id: found.id,
      name: found.name,
    };
  }

  const effectType = p.type || "DROP_SHADOW";
  let effect: any;

  if (effectType === "LAYER_BLUR") {
    effect = {
      type: "LAYER_BLUR",
      blurType: "NORMAL",
      radius: Number(p.radius ?? 4),
      visible: true,
    };
  } else if (effectType === "BACKGROUND_BLUR") {
    effect = {
      type: "BACKGROUND_BLUR",
      blurType: "NORMAL",
      radius: Number(p.radius ?? 4),
      visible: true,
    };
  } else {
    const { r, g, b, a } = hexToRgb(p.color || "#000000");
    const alpha = p.opacity != null ? Number(p.opacity) : a !== 1 ? a : 0.25;
    effect = {
      type: effectType,
      color: { r, g, b, a: alpha },
      offset: {
        x: Number(p.offsetX ?? 0),
        y: Number(p.offsetY ?? 4),
      },
      radius: Number(p.radius ?? 8),
      spread: Number(p.spread ?? 0),
      visible: true,
      blendMode: "NORMAL",
    };
  }

  const style = figma.createEffectStyle();
  style.name = p.name;
  style.effects = [effect];

  if (p.description) {
    style.description = p.description;
  }

  figma.commitUndo();

  return {
    id: style.id,
    name: style.name,
  };
};
