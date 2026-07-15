/**
 * Shared helper functions for create handlers.
 * Extracted from the oracle to avoid duplication across create_frame, create_rectangle, etc.
 */

/**
 * Convert hex color string to RGB components normalized to 0-1 range.
 * Supports #RRGGBB or #RRGGBBAA format.
 */
export function hexToRgb(hex: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
    a: clean.length >= 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1,
  };
}

/**
 * Create a SOLID paint from a color input.
 * Color can be a hex string or a {r, g, b, a?} object.
 * Returns a paint object ready to assign to node.fills or node.strokes.
 */
export function makeSolidPaint(
  colorInput: string | { r: number; g: number; b: number; a?: number },
  opacityOverride?: number,
): any {
  const { r, g, b, a } =
    typeof colorInput === "string"
      ? hexToRgb(colorInput)
      : {
          r: colorInput.r,
          g: colorInput.g,
          b: colorInput.b,
          a: colorInput.a != null ? colorInput.a : 1,
        };

  const eff = opacityOverride != null ? opacityOverride : a;
  const paint: any = { type: "SOLID", color: { r, g, b } };

  if (eff !== 1) {
    paint.opacity = eff;
  }

  return paint;
}

/**
 * Get the parent node for appending children.
 * If parentId is provided, fetch it; otherwise use current page.
 * Validates that the node can accept children (has appendChild method).
 */
export async function getParentNode(parentId?: string): Promise<any> {
  if (!parentId) {
    return figma.currentPage;
  }

  const parent = await figma.getNodeByIdAsync(parentId);

  if (!parent) {
    throw new Error(`Parent node not found: ${parentId}`);
  }

  if (!("appendChild" in parent)) {
    throw new Error(`Node ${parentId} cannot have children`);
  }

  return parent;
}

/**
 * Apply auto layout properties to a frame.
 * Only applies layout-specific properties if layoutMode is set to something other than "NONE".
 */
export function applyAutoLayout(frame: any, params: any): void {
  if (params.layoutMode != null) {
    frame.layoutMode = params.layoutMode;
  }

  if (params.paddingTop != null) {
    frame.paddingTop = Number(params.paddingTop);
  }

  if (params.paddingRight != null) {
    frame.paddingRight = Number(params.paddingRight);
  }

  if (params.paddingBottom != null) {
    frame.paddingBottom = Number(params.paddingBottom);
  }

  if (params.paddingLeft != null) {
    frame.paddingLeft = Number(params.paddingLeft);
  }

  if (params.itemSpacing != null) {
    frame.itemSpacing = Number(params.itemSpacing);
  }

  if (frame.layoutMode !== "NONE") {
    if (params.primaryAxisAlignItems) {
      frame.primaryAxisAlignItems = params.primaryAxisAlignItems;
    }

    if (params.counterAxisAlignItems) {
      frame.counterAxisAlignItems = params.counterAxisAlignItems;
    }

    if (params.primaryAxisSizingMode) {
      frame.primaryAxisSizingMode = params.primaryAxisSizingMode;
    }

    if (params.counterAxisSizingMode) {
      frame.counterAxisSizingMode = params.counterAxisSizingMode;
    }

    if (params.layoutWrap) {
      frame.layoutWrap = params.layoutWrap;
    }

    if (params.counterAxisSpacing != null && frame.layoutWrap === "WRAP") {
      frame.counterAxisSpacing = Number(params.counterAxisSpacing);
    }
  }
}

/**
 * Decode base64 string to Uint8Array.
 * Manual implementation since atob is not available in Figma plugin sandbox.
 */
export function base64ToBytes(b64: string): Uint8Array {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup: { [key: string]: number } = {};

  for (let i = 0; i < chars.length; i++) {
    lookup[chars[i]] = i;
  }

  // Remove whitespace and validate
  const padded = b64.replace(/[^A-Za-z0-9+/=]/g, "");
  const clean = padded.replace(/=/g, "");

  // Calculate output length
  let outLen = Math.floor((padded.length * 3) / 4);
  if (padded.endsWith("==")) {
    outLen -= 2;
  } else if (padded.endsWith("=")) {
    outLen -= 1;
  }

  const bytes = new Uint8Array(outLen);
  let j = 0;

  // Decode 4 base64 chars at a time
  for (let i = 0; i < clean.length; i += 4) {
    const a = lookup[clean[i]] || 0;
    const bv = lookup[clean[i + 1]] || 0;
    const c = lookup[clean[i + 2]] || 0;
    const d = lookup[clean[i + 3]] || 0;

    bytes[j++] = (a << 2) | (bv >> 4);

    if (j < outLen) {
      bytes[j++] = ((bv & 15) << 4) | (c >> 2);
    }

    if (j < outLen) {
      bytes[j++] = ((c & 3) << 6) | d;
    }
  }

  return bytes;
}
