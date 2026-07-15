/**
 * rename_node handler — renames a node.
 */

import { Handler } from "../../dispatcher";

export const handleRenameNode: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeIds = params.nodeIds || [];

  if (nodeIds.length === 0) {
    throw new Error("nodeIds is required");
  }

  const nodeId = nodeIds[0];
  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  node.name = p.name;

  return {
    id: node.id,
    name: node.name,
  };
};
