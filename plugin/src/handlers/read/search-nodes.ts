/**
 * search_nodes handler — searches for nodes by name and type within a scope.
 */

import { Handler } from "../../dispatcher";

interface SearchResult {
  id: string;
  name: string;
  type: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const handleSearchNodes: Handler = async (params: any) => {
  const query = params.params?.query ? params.params.query.toLowerCase() : "";
  const scopeNodeId = params.params?.nodeId;
  const types = params.params?.types || [];
  const limit = params.params?.limit || 50;

  const root = scopeNodeId
    ? await figma.getNodeByIdAsync(scopeNodeId)
    : figma.currentPage;

  if (!root) {
    throw new Error(`Node not found: ${scopeNodeId}`);
  }

  const results: SearchResult[] = [];

  async function search(n: any) {
    if (results.length >= limit) return;

    if (n !== root) {
      const nameMatch = !query || n.name.toLowerCase().includes(query);
      const typeMatch = types.length === 0 || types.includes(n.type);

      if (nameMatch && typeMatch) {
        const result: SearchResult = {
          id: n.id,
          name: n.name,
          type: n.type,
        };

        // Add bounds if available
        if ("x" in n && "y" in n && "width" in n && "height" in n) {
          result.bounds = {
            x: Math.round(n.x * 100) / 100,
            y: Math.round(n.y * 100) / 100,
            width: Math.round(n.width * 100) / 100,
            height: Math.round(n.height * 100) / 100,
          };
        }

        results.push(result);
      }
    }

    if (results.length < limit && "children" in n) {
      for (const child of n.children) {
        await search(child);
      }
    }
  }

  await search(root);

  return {
    count: results.length,
    nodes: results,
  };
};
