/**
 * get_nodes_info handler — returns serialized info for multiple nodes by IDs.
 */

import { Handler } from "../../dispatcher";
import { serializeNode } from "../../serialize";

export const handleGetNodesInfo: Handler = async (params: any) => {
  if (!params.nodeIds || params.nodeIds.length === 0) {
    throw new Error("nodeIds is required for get_nodes_info");
  }

  const nodes = await Promise.all(
    params.nodeIds.map((id: string) => figma.getNodeByIdAsync(id)),
  );

  const serialized = await Promise.all(
    nodes
      .filter((n) => n !== null && n.type !== "DOCUMENT")
      .map((n) => serializeNode(n)),
  );

  return serialized;
};
