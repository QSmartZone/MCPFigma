/**
 * add_variable_mode handler — adds a new mode to a variable collection.
 */

import { Handler } from "../../dispatcher";

export const handleAddVariableMode: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.collectionId) {
    throw new Error("collectionId is required");
  }

  if (!p.modeName) {
    throw new Error("modeName is required");
  }

  const collection = await figma.variables.getVariableCollectionByIdAsync(
    p.collectionId,
  );

  if (!collection) {
    throw new Error(`Collection not found: ${p.collectionId}`);
  }

  const modeId = collection.addMode(p.modeName);

  figma.commitUndo();

  return {
    collectionId: p.collectionId,
    modeId,
    modeName: p.modeName,
  };
};
