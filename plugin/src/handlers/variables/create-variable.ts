/**
 * create_variable handler — creates a new variable in a collection.
 */

import { Handler } from "../../dispatcher";
import { parseVariableValue } from "./helpers";

export const handleCreateVariable: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.name) {
    throw new Error("name is required");
  }

  if (!p.collectionId) {
    throw new Error("collectionId is required");
  }

  const validTypes = ["COLOR", "FLOAT", "STRING", "BOOLEAN"];
  if (!p.type || !validTypes.includes(p.type)) {
    throw new Error("type is required: COLOR, FLOAT, STRING, or BOOLEAN");
  }

  const collection = await figma.variables.getVariableCollectionByIdAsync(
    p.collectionId,
  );

  if (!collection) {
    throw new Error(`Collection not found: ${p.collectionId}`);
  }

  const variable = figma.variables.createVariable(p.name, collection, p.type);

  if (p.value != null && collection.modes.length > 0) {
    const modeId = collection.modes[0].modeId;
    variable.setValueForMode(modeId, parseVariableValue(p.type, p.value));
  }

  figma.commitUndo();

  return {
    id: variable.id,
    name: variable.name,
    resolvedType: variable.resolvedType,
    collectionId: p.collectionId,
  };
};
