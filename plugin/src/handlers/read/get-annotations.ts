/**
 * get_annotations handler — returns annotations from a node or all annotated nodes in current page.
 */

import { Handler } from "../../dispatcher";

export const handleGetAnnotations: Handler = async (params: any) => {
  const nodeId = params.params?.nodeId;

  function getNodeAnnotations(n: any): any[] | null {
    const anns = n.annotations;
    return Array.isArray(anns) ? anns : null;
  }

  // If nodeId is specified, return annotations from that node and its children
  if (nodeId) {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    const mergedAnnotations: any[] = [];

    async function collect(n: any) {
      const anns = getNodeAnnotations(n);
      if (anns) {
        for (const a of anns) {
          mergedAnnotations.push({ nodeId: n.id, annotation: a });
        }
      }

      if ("children" in n) {
        for (const child of n.children) {
          await collect(child);
        }
      }
    }

    await collect(node);

    return {
      nodeId: node.id,
      name: node.name,
      annotations: mergedAnnotations,
    };
  }

  // Otherwise, return all annotated nodes in current page
  const annotated: any[] = [];

  async function processNode(n: any) {
    const anns = getNodeAnnotations(n);
    if (anns && anns.length > 0) {
      annotated.push({ nodeId: n.id, name: n.name, annotations: anns });
    }

    if ("children" in n) {
      for (const child of n.children) {
        await processNode(child);
      }
    }
  }

  await processNode(figma.currentPage);

  return {
    annotatedNodes: annotated,
  };
};
