/**
 * swap_component handler — swaps a component instance to point to a different component.
 */

import { Handler } from "../../dispatcher";

export const handleSwapComponent: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeId = params.nodeIds && params.nodeIds[0];

  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  if (!p.componentId) {
    throw new Error("componentId is required");
  }

  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (node.type !== "INSTANCE") {
    throw new Error(`Node ${nodeId} is not a component INSTANCE`);
  }

  const component = await figma.getNodeByIdAsync(p.componentId);

  if (!component) {
    throw new Error(`Component not found: ${p.componentId}`);
  }

  if (component.type !== "COMPONENT") {
    throw new Error(`Node ${p.componentId} is not a COMPONENT`);
  }

  (node as any).mainComponent = component;

  figma.commitUndo();

  return {
    id: node.id,
    name: node.name,
    componentId: component.id,
    componentName: component.name,
  };
};
