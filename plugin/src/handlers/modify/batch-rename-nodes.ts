/**
 * batch_rename_nodes handler — renames multiple nodes with find/replace.
 */

import { Handler } from "../../dispatcher";

export const handleBatchRenameNodes: Handler = async (params: any) => {
  const p = params.params || {};
  const nodeIds = params.nodeIds || [];

  if (nodeIds.length === 0) {
    throw new Error("nodeIds is required");
  }

  const results: any[] = [];

  for (const nid of nodeIds) {
    const n = await figma.getNodeByIdAsync(nid);

    if (!n) {
      results.push({ nodeId: nid, error: "Node not found" });
      continue;
    }

    const oldName = n.name;
    let newName = oldName;

    if (p.find !== undefined && p.replace !== undefined) {
      if (p.useRegex) {
        try {
          const regex = new RegExp(p.find, p.regexFlags || "g");
          newName = newName.replace(regex, p.replace);
        } catch (e) {
          results.push({
            nodeId: nid,
            error: `Invalid regex: ${(e as any).message}`,
          });
          continue;
        }
      } else {
        newName = newName.split(p.find).join(p.replace);
      }
    }

    if (p.prefix) newName = p.prefix + newName;
    if (p.suffix) newName = newName + p.suffix;

    n.name = newName;
    results.push({ nodeId: nid, oldName, name: newName });
  }

  figma.commitUndo();

  return { results };
};
