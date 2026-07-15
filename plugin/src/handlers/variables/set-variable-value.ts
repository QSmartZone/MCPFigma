/**
 * set_variable_value handler — sets the value of a variable for a specific mode.
 */

import { Handler } from "../../dispatcher";
import { parseVariableValue } from "./helpers";

export const handleSetVariableValue: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.variableId) {
    throw new Error("variableId is required");
  }

  if (!p.modeId) {
    throw new Error("modeId is required");
  }

  if (p.value == null) {
    throw new Error("value is required");
  }

  const variable = await figma.variables.getVariableByIdAsync(p.variableId);

  if (!variable) {
    throw new Error(`Variable not found: ${p.variableId}`);
  }

  variable.setValueForMode(
    p.modeId,
    parseVariableValue(variable.resolvedType, p.value),
  );

  figma.commitUndo();

  return {
    variableId: variable.id,
    name: variable.name,
    modeId: p.modeId,
  };
};
