/**
 * rename_page handler — renames a page.
 */

import { Handler } from "../../dispatcher";
import { resolvePage } from "./helpers";

export const handleRenamePage: Handler = async (params: any) => {
  const p = params.params || {};

  const page = await resolvePage(p);

  if (!p.newName) {
    throw new Error("newName is required");
  }

  const oldName = page.name;
  page.name = p.newName;

  figma.commitUndo();

  return { id: page.id, oldName, name: page.name };
};
