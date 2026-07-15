/**
 * create_variable_collection handler — creates a new variable collection.
 */

import { Handler } from "../../dispatcher";

export const handleCreateVariableCollection: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.name) {
    throw new Error("name is required");
  }

  const collection = figma.variables.createVariableCollection(p.name);

  if (p.initialModeName && collection.modes.length > 0) {
    collection.renameMode(collection.modes[0].modeId, p.initialModeName);
  }

  figma.commitUndo();

  return {
    id: collection.id,
    name: collection.name,
    modes: collection.modes.map((m) => ({
      modeId: m.modeId,
      name: m.name,
    })),
  };
};
