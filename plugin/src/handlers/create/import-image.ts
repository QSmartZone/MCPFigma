/**
 * import_image handler — creates an image from base64-encoded data.
 * Decodes base64 to bytes, creates an image, and fills a rectangle with it.
 */

import { Handler } from "../../dispatcher";
import { getBounds } from "../../serialize";
import { getParentNode, base64ToBytes } from "./helpers";

export const handleImportImage: Handler = async (params: any) => {
  const p = params.params || {};

  if (!p.imageData) {
    throw new Error("imageData (base64) is required");
  }

  const parent = await getParentNode(p.parentId);

  // Decode base64 to bytes
  const bytes = base64ToBytes(p.imageData);

  // Create image from decoded bytes
  const image = figma.createImage(bytes);

  // Create rectangle and fill it with the image
  const rect = figma.createRectangle();
  rect.resize(p.width || 200, p.height || 200);
  rect.x = p.x != null ? p.x : 0;
  rect.y = p.y != null ? p.y : 0;

  if (p.name) {
    rect.name = p.name;
  }

  rect.fills = [
    {
      type: "IMAGE",
      imageHash: image.hash,
      scaleMode: p.scaleMode || "FILL",
    },
  ];

  parent.appendChild(rect);
  figma.commitUndo();

  return {
    id: rect.id,
    name: rect.name,
    type: rect.type,
    bounds: getBounds(rect),
  };
};
