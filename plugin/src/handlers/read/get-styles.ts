/**
 * get_styles handler — returns all local styles (paint, text, effect, grid).
 */

import { Handler } from "../../dispatcher";

export const handleGetStyles: Handler = async (params: any) => {
  const [paintStyles, textStyles, effectStyles, gridStyles] = await Promise.all(
    [
      figma.getLocalPaintStylesAsync(),
      figma.getLocalTextStylesAsync(),
      figma.getLocalEffectStylesAsync(),
      figma.getLocalGridStylesAsync(),
    ],
  );

  return {
    paints: paintStyles.map((s) => ({
      id: s.id,
      name: s.name,
      paints: s.paints,
    })),
    text: textStyles.map((s) => ({
      id: s.id,
      name: s.name,
      fontSize: s.fontSize,
      fontFamily: s.fontName ? s.fontName.family : undefined,
      fontStyle: s.fontName ? s.fontName.style : undefined,
      textDecoration:
        s.textDecoration !== "NONE" ? s.textDecoration : undefined,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
    })),
    effects: effectStyles.map((s) => ({
      id: s.id,
      name: s.name,
      effects: s.effects,
    })),
    grids: gridStyles.map((s) => ({
      id: s.id,
      name: s.name,
      layoutGrids: s.layoutGrids,
    })),
  };
};
