/**
 * export_frames_to_pdf handler — exports specified nodes to PDF format as base64.
 */

import { Handler } from "../../dispatcher";

export const handleExportFramesToPdf: Handler = async (params: any) => {
  const nodeIds = params.nodeIds || [];

  if (nodeIds.length === 0) {
    throw new Error("nodeIds is required and must not be empty");
  }

  const frames = await Promise.all(
    nodeIds.map(async (id: string) => {
      const node = await figma.getNodeByIdAsync(id);

      if (!node || node.type === "DOCUMENT" || node.type === "PAGE") {
        throw new Error(`Node ${id} not found or is not exportable`);
      }

      const bytes = await node.exportAsync({ format: "PDF" });
      const base64 = figma.base64Encode(bytes);

      return {
        nodeId: node.id,
        nodeName: node.name,
        base64,
      };
    }),
  );

  return {
    frames,
  };
};
