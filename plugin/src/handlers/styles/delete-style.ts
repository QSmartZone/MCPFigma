/**
 * delete_style handler — deletes a style by ID.
 */

import { Handler } from "../../dispatcher";

export const handleDeleteStyle: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.styleId) {
    throw new Error("styleId is required");
  }

  const style = await figma.getStyleByIdAsync(p.styleId);

  if (!style) {
    throw new Error(`Style not found: ${p.styleId}`);
  }

  style.remove();
  figma.commitUndo();

  return {
    styleId: p.styleId,
    deleted: true,
  };
};
