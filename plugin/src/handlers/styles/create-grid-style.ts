/**
 * create_grid_style handler — creates a new grid style (columns, rows, or regular grid).
 */

import { Handler } from "../../dispatcher";
import { hexToRgb } from "../create/helpers";

export const handleCreateGridStyle: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.name) {
    throw new Error("name is required");
  }

  const existing = await figma.getLocalGridStylesAsync();
  const found = existing.find((s) => s.name === p.name);

  if (found) {
    return {
      id: found.id,
      name: found.name,
    };
  }

  const pattern = p.pattern || "GRID";
  let grid: any;

  if (pattern === "COLUMNS" || pattern === "ROWS") {
    grid = {
      pattern,
      count: Number(p.count ?? 12),
      gutterSize: Number(p.gutterSize ?? 16),
      offset: Number(p.offset ?? 0),
      alignment: p.alignment || "STRETCH",
      visible: true,
    };
  } else {
    const { r, g, b, a } = hexToRgb(p.color || "#FF0000");
    grid = {
      pattern: "GRID",
      sectionSize: Number(p.sectionSize ?? 8),
      visible: true,
      color: {
        r,
        g,
        b,
        a: p.opacity != null ? Number(p.opacity) : a !== 1 ? a : 0.1,
      },
    };
  }

  const style = figma.createGridStyle();
  style.name = p.name;
  style.layoutGrids = [grid];

  if (p.description) {
    style.description = p.description;
  }

  figma.commitUndo();

  return {
    id: style.id,
    name: style.name,
  };
};
