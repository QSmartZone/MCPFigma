/**
 * reorder_nodes handler — reorders nodes in their parent (bringToFront, sendToBack, etc.).
 */

import { Handler } from "../../dispatcher";

export const handleReorderNodes: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeIds = params.nodeIds || [];

  if (nodeIds.length === 0) {
    throw new Error("nodeIds is required");
  }

  const validOrders = [
    "bringToFront",
    "sendToBack",
    "bringForward",
    "sendBackward",
  ];
  if (!validOrders.includes(p.order)) {
    throw new Error(
      `order must be bringToFront, sendToBack, bringForward, or sendBackward`,
    );
  }

  const results: any[] = [];

  for (const nid of nodeIds) {
    const n = await figma.getNodeByIdAsync(nid);

    if (!n) {
      results.push({ nodeId: nid, error: "Node not found" });
      continue;
    }

    const parent = n.parent;
    if (!parent || !("children" in parent)) {
      results.push({ nodeId: nid, error: "Node has no reorderable parent" });
      continue;
    }

    const siblings = parent.children;
    const currentIndex = siblings.indexOf(n);
    let newIndex;

    switch (p.order) {
      case "bringToFront":
        newIndex = siblings.length - 1;
        break;
      case "sendToBack":
        newIndex = 0;
        break;
      case "bringForward":
        newIndex = Math.min(currentIndex + 1, siblings.length - 1);
        break;
      case "sendBackward":
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      default:
        newIndex = currentIndex;
    }

    parent.insertChild(newIndex, n as SceneNode);
    results.push({ nodeId: nid, index: newIndex });
  }

  figma.commitUndo();

  return { results };
};
