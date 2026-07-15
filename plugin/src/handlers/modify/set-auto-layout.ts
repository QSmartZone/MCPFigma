/**
 * set_auto_layout handler — configures auto layout properties on a FRAME node.
 */

import { Handler } from "../../dispatcher";
import { applyAutoLayout } from "../create/helpers";

export const handleSetAutoLayout: Handler = async (params: any) => {
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

  if (node.type !== "FRAME") {
    throw new Error(`Node ${nodeId} is not a FRAME`);
  }

  applyAutoLayout(node, p);

  figma.commitUndo();

  return {
    id: node.id,
    name: node.name,
  };
};
