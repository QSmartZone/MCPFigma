import { FigmaLinkParsed } from "../figma/types.js";

const FILE_ID_RE = /^[a-zA-Z0-9_-]+$/;
const NODE_ID_RE = /^[\d]+([-:][\w-]+)*$/;

export function parseFigmaLink(link: string): FigmaLinkParsed {
  // Supports:
  // https://www.figma.com/design/{fileId}/...?node-id={nodeId}
  // https://www.figma.com/file/{fileId}/...?node-id={nodeId}
  // Plain fileId
  const urlMatch = link.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9_-]+)/);
  const fileId = urlMatch ? urlMatch[1] : link.trim();

  if (!FILE_ID_RE.test(fileId)) {
    throw new Error(`Invalid Figma file ID: "${fileId}"`);
  }

  const nodeMatch = link.match(/node-id=([^&\s]+)/);
  const nodeId = nodeMatch ? decodeURIComponent(nodeMatch[1]) : null;

  if (nodeId && !NODE_ID_RE.test(nodeId)) {
    throw new Error(`Invalid Figma node ID: "${nodeId}"`);
  }

  return { fileId, nodeId };
}

export function validateFigmaLink(link: string): string | null {
  try {
    parseFigmaLink(link);
    return null; // Valid, no error
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
