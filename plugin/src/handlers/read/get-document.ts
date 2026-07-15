/**
 * get_document handler — serializes the current page as a node tree.
 */

import { Handler } from "../../dispatcher";
import { serializeNode, deduplicateStyles } from "../../serialize";

export const handleGetDocument: Handler = async (params: any) => {
  const raw = await serializeNode(figma.currentPage);
  const { tree, globalVars } = deduplicateStyles(raw);

  // Merge globalVars into the tree if dedup found shared styles
  if (globalVars) {
    return { ...tree, globalVars };
  }

  return tree;
};
