/**
 * find_replace_text handler — finds and replaces text in nodes.
 */

import { Handler } from "../../dispatcher";

export const handleFindReplaceText: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.find) {
    throw new Error("find is required");
  }

  if (p.replace === undefined) {
    throw new Error("replace is required");
  }

  const rootNodeId = params.nodeIds && params.nodeIds[0];
  const root = rootNodeId
    ? await figma.getNodeByIdAsync(rootNodeId)
    : figma.currentPage;

  if (!root) {
    throw new Error(`Root node not found: ${rootNodeId}`);
  }

  const textNodes: any[] = [];

  const collect = (node: any) => {
    if (node.type === "TEXT") textNodes.push(node);
    if ("children" in node) node.children.forEach(collect);
  };

  collect(root);

  const results: any[] = [];

  for (const tn of textNodes) {
    const originalText = tn.characters;
    let newText;

    if (p.useRegex) {
      try {
        const regex = new RegExp(p.find, p.regexFlags || "g");
        newText = originalText.replace(regex, p.replace);
      } catch (e) {
        results.push({
          nodeId: tn.id,
          nodeName: tn.name,
          error: `Invalid regex: ${(e as any).message}`,
        });
        continue;
      }
    } else {
      newText = originalText.split(p.find).join(p.replace);
    }

    if (newText !== originalText) {
      const fontName =
        typeof tn.fontName === "symbol"
          ? { family: "Inter", style: "Regular" }
          : tn.fontName;
      await figma.loadFontAsync(fontName);
      tn.characters = newText;
      results.push({
        nodeId: tn.id,
        nodeName: tn.name,
        oldText: originalText,
        newText,
      });
    }
  }

  figma.commitUndo();

  const replaced = results.filter((r) => !r.error).length;

  return { replaced, results };
};
