/**
 * create_component handler — converts a frame to a component.
 * Takes a frame node, copies its properties, moves children, removes original, returns component.
 */

import { Handler } from "../../dispatcher";
import { getBounds } from "../../serialize";

export const handleCreateComponent: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeId = params.nodeIds?.[0];

  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (node.type !== "FRAME") {
    throw new Error(
      `Node ${nodeId} is not a FRAME — only frames can be converted to components`,
    );
  }

  const parent = node.parent;

  if (!parent) {
    throw new Error("Node parent not found");
  }

  const index = parent.children.indexOf(node);

  // Create component with same properties as frame
  const component = figma.createComponent();
  component.name = p.name || node.name;
  component.resize(node.width, node.height);
  component.x = node.x;
  component.y = node.y;
  component.fills = node.fills;
  component.strokes = node.strokes;

  // Copy corner radius if it's not mixed
  if (node.cornerRadius != null && node.cornerRadius !== figma.mixed) {
    component.cornerRadius = node.cornerRadius;
  }

  // Copy auto layout properties if set
  if (node.layoutMode && node.layoutMode !== "NONE") {
    component.layoutMode = node.layoutMode;
    component.paddingTop = node.paddingTop;
    component.paddingRight = node.paddingRight;
    component.paddingBottom = node.paddingBottom;
    component.paddingLeft = node.paddingLeft;
    component.itemSpacing = node.itemSpacing;
    component.primaryAxisAlignItems = node.primaryAxisAlignItems;
    component.counterAxisAlignItems = node.counterAxisAlignItems;
  }

  // Move all children to component
  for (const child of [...node.children]) {
    component.appendChild(child);
  }

  // Replace node with component at the same index
  parent.insertChild(index, component);
  node.remove();

  figma.commitUndo();

  return {
    id: component.id,
    name: component.name,
    type: component.type,
    bounds: getBounds(component),
  };
};
