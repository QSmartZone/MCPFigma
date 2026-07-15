/**
 * set_text handler — updates text content of a TEXT node.
 * CRITICAL: Must load the node's font before setting characters.
 */

import { Handler } from "../../dispatcher";

export const handleSetText: Handler = async (params: any) => {
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

  if (node.type !== "TEXT") {
    throw new Error(`Node ${nodeId} is not a TEXT node`);
  }

  // Load the node's font before mutation
  // If fontName is a symbol, use default Inter/Regular
  const fontName =
    typeof node.fontName === "symbol"
      ? { family: "Inter", style: "Regular" }
      : node.fontName;
  await figma.loadFontAsync(fontName);

  // Set the text content
  node.characters = p.text;

  figma.commitUndo();

  return {
    id: node.id,
    name: node.name,
    characters: node.characters,
  };
};
