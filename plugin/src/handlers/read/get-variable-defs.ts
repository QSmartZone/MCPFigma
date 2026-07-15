/**
 * get_variable_defs handler — returns all local variable collections, modes, and variable definitions.
 */

import { Handler } from "../../dispatcher";
import { serializeVariableValue } from "../../serialize";

export const handleGetVariableDefs: Handler = async (params: any) => {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  const variableData = await Promise.all(
    collections.map(async (collection) => {
      const variables = await Promise.all(
        collection.variableIds.map((id) =>
          figma.variables.getVariableByIdAsync(id),
        ),
      );

      return {
        id: collection.id,
        name: collection.name,
        modes: collection.modes.map((mode) => ({
          modeId: mode.modeId,
          name: mode.name,
        })),
        variables: variables
          .filter((v) => v !== null)
          .map((variable) => ({
            id: variable.id,
            name: variable.name,
            resolvedType: variable.resolvedType,
            valuesByMode: Object.fromEntries(
              Object.entries(variable.valuesByMode).map(([modeId, value]) => [
                modeId,
                serializeVariableValue(value),
              ]),
            ),
          })),
      };
    }),
  );

  return {
    collections: variableData,
  };
};
