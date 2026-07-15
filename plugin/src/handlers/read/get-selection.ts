/**
 * get_selection handler — returns serialized nodes from the current selection.
 */

import { Handler } from "../../dispatcher";
import { serializeNode } from "../../serialize";

export const handleGetSelection: Handler = async (params: any) => {
  return Promise.all(
    figma.currentPage.selection.map((node) => serializeNode(node)),
  );
};
