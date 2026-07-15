/**
 * add_page handler — creates a new page.
 */

import { Handler } from "../../dispatcher";

export const handleAddPage: Handler = async (params: any) => {
  const p = params.params || {};

  const page = figma.createPage();

  if (p.name) {
    page.name = p.name;
  }

  if (p.index != null) {
    figma.root.insertChild(Number(p.index), page);
  }

  figma.commitUndo();

  return {
    id: page.id,
    name: page.name,
    index: figma.root.children.indexOf(page),
  };
};
