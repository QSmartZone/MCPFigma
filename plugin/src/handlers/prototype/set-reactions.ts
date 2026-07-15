/**
 * set_reactions handler — sets reactions on a node.
 */

import { Handler } from "../../dispatcher";
import { buildReaction, parseArray, setReactions } from "./helpers";

export const handleSetReactions: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeId = params.nodeIds && params.nodeIds[0];

  if (!nodeId) {
    throw new Error("nodeId is required");
  }

  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (!("reactions" in node)) {
    throw new Error(`Node ${nodeId} does not support reactions`);
  }

  const incoming = parseArray(p.reactions).map(buildReaction);
  const current = (node as any).reactions;
  const final = p.mode === "append" ? [...current, ...incoming] : incoming;

  await setReactions(node, final);

  figma.commitUndo();

  return { id: node.id, name: node.name, reactionCount: final.length };
};
