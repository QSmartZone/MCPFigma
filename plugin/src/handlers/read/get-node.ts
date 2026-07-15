/**
 * get_node handler — returns a serialized node by ID.
 */

import { Handler } from "../../dispatcher";
import { serializeNode } from "../../serialize";

export const handleGetNode: Handler = async (params: any) => {
  const nodeId = params.nodeIds?.[0];
  if (!nodeId) throw new Error("nodeIds is required for get_node");

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || node.type === "DOCUMENT") {
    throw new Error(`Node not found: ${nodeId}`);
  }

  return serializeNode(node);
};
