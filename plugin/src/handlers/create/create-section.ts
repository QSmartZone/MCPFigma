/**
 * create_section handler — creates a new section node.
 */

import { Handler } from "../../dispatcher";
import { getBounds } from "../../serialize";

export const handleCreateSection: Handler = async (params: any) => {
  const p = params.params || {};

  const section = figma.createSection();

  if (p.name) {
    section.name = p.name;
  }

  if (p.x != null) {
    section.x = p.x;
  }

  if (p.y != null) {
    section.y = p.y;
  }

  if (p.width != null || p.height != null) {
    section.resizeWithoutConstraints(
      p.width || section.width,
      p.height || section.height,
    );
  }

  figma.commitUndo();

  return {
    id: section.id,
    name: section.name,
    type: section.type,
    bounds: getBounds(section),
  };
};
