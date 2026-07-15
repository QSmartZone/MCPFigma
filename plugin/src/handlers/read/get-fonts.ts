/**
 * get_fonts handler — collects and returns all fonts used in the current page.
 */

import { Handler } from "../../dispatcher";

export const handleGetFonts: Handler = async (params: any) => {
  const fontMap = new Map<
    string,
    { family: string; style: string; nodeCount: number }
  >();

  function collectFonts(n: any) {
    if (n.type === "TEXT") {
      const fontName = n.fontName;
      if (typeof fontName !== "symbol" && fontName) {
        const key = `${fontName.family}::${fontName.style}`;
        if (!fontMap.has(key)) {
          fontMap.set(key, {
            family: fontName.family,
            style: fontName.style,
            nodeCount: 0,
          });
        }
        const entry = fontMap.get(key);
        if (entry) entry.nodeCount++;
      }
    }
    if ("children" in n) {
      n.children.forEach(collectFonts);
    }
  }

  collectFonts(figma.currentPage);

  const fonts = Array.from(fontMap.values()).sort(
    (a, b) => b.nodeCount - a.nodeCount,
  );

  return {
    count: fonts.length,
    fonts,
  };
};
