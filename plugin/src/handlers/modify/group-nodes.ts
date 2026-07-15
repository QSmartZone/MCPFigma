/**
 * group_nodes handler — groups multiple nodes together.
 */

import { Handler } from "../../dispatcher";

export const handleGroupNodes: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeIds = params.nodeIds || [];

  if (nodeIds.length === 0) {
    throw new Error("nodeIds is required");
  }

  const nodes = await Promise.all(
    nodeIds.map((id: string) => figma.getNodeByIdAsync(id)),
  );
  const validNodes = nodes.filter(
    (n) => n !== null && n.type !== "DOCUMENT" && n.type !== "PAGE",
  );

  if (validNodes.length === 0) {
    throw new Error("No valid scene nodes found");
  }

  const parent = validNodes[0].parent;
  if (!parent) {
    throw new Error("Nodes must have a parent");
  }

  const group = figma.group(validNodes, parent);

  if (p.name) group.name = p.name;

  figma.commitUndo();

  return {
    id: group.id,
    name: group.name,
    type: group.type,
  };
};
