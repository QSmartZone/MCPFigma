/**
 * delete_variable handler — deletes a variable or collection by ID.
 */

import { Handler } from "../../dispatcher";

export const handleDeleteVariable: Handler = async (params: any) => {
  const p = params.params || {};

  if (p.variableId) {
    const variable = await figma.variables.getVariableByIdAsync(p.variableId);

    if (!variable) {
      throw new Error(`Variable not found: ${p.variableId}`);
    }

    variable.remove();
    figma.commitUndo();

    return {
      variableId: p.variableId,
      deleted: true,
    };
  } else if (p.collectionId) {
    const collection = await figma.variables.getVariableCollectionByIdAsync(
      p.collectionId,
    );

    if (!collection) {
      throw new Error(`Collection not found: ${p.collectionId}`);
    }

    collection.remove();
    figma.commitUndo();

    return {
      collectionId: p.collectionId,
      deleted: true,
    };
  } else {
    throw new Error("variableId or collectionId is required");
  }
};
