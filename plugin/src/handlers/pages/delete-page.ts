/**
 * delete_page handler — deletes a page from the document.
 */

import { Handler } from "../../dispatcher";
import { resolvePage } from "./helpers";

export const handleDeletePage: Handler = async (params: any) => {
  const p = params.params || {};

  const page = await resolvePage(p);

  if (figma.root.children.length <= 1) {
    throw new Error("Cannot delete the only page in the document");
  }

  const deletedId = page.id;
  const deletedName = page.name;

  page.remove();

  figma.commitUndo();

  return { id: deletedId, name: deletedName, deleted: true };
};
