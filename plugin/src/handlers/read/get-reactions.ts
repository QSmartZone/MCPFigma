/**
 * get_reactions handler — returns reactions for a specific node.
 */

import { Handler } from "../../dispatcher";

export const handleGetReactions: Handler = async (params: any) => {
  const nodeId = params.nodeIds?.[0];
  if (!nodeId) {
    throw new Error("nodeId is required for get_reactions");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || node.type === "DOCUMENT") {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const reactions = "reactions" in node ? node.reactions : [];

  return {
    nodeId: node.id,
    name: node.name,
    reactions,
  };
};
