/**
 * Node serialization — converts Figma nodes to plain objects.
 * Used by read handlers (get_document, get_selection, get_node, get_nodes_info, search_nodes, get_annotations).
 */

interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SerializedStyles {
  [key: string]: any;
}

interface SerializedNode {
  id: string;
  name: string;
  type: string;
  bounds?: NodeBounds;
  styles: SerializedStyles;
  children?: SerializedNode[];
  [key: string]: any;
}

interface GlobalVars {
  styles: {
    [key: string]: any;
  };
}

interface DedupResult {
  tree: SerializedNode;
  globalVars?: GlobalVars;
}

/**
 * Check if a value is the Figma "mixed" symbol.
 */
export function isMixed(value: any): boolean {
  return typeof value === "symbol";
}

/**
 * Round pixels to 2 decimal places.
 */
export function pixelRound(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Convert Figma color to hex string.
 */
export function toHex(color: any): string {
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v * 255)));
  const [r, g, b] = [clamp(color.r), clamp(color.g), clamp(color.b)];
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Serialize paints (fills/strokes) to hex strings.
 * Returns undefined if no solid paints, "mixed" if mixed, or array of hex strings.
 */
export function serializePaints(paints: any): string | string[] | undefined {
  if (isMixed(paints)) return "mixed";
  if (!paints || !Array.isArray(paints)) return undefined;

  const result = paints
    .filter((paint: any) => paint.type === "SOLID" && "color" in paint)
    .map((paint: any) => {
      const hex = toHex(paint.color);
      const opacity = paint.opacity != null ? paint.opacity : 1;
      if (opacity === 1) return hex;
      return (
        hex +
        Math.round(opacity * 255)
          .toString(16)
          .padStart(2, "0")
      );
    });

  return result.length > 0 ? result : undefined;
}

/**
 * Get bounds from a node (x, y, width, height).
 */
export function getBounds(node: any): NodeBounds | undefined {
  if ("x" in node && "y" in node && "width" in node && "height" in node) {
    return {
      x: pixelRound(node.x),
      y: pixelRound(node.y),
      width: pixelRound(node.width),
      height: pixelRound(node.height),
    };
  }
  return undefined;
}

/**
 * Serialize styles (fills, strokes, corner radius, padding, etc.) from a node.
 * Returns a styles object that may be empty.
 */
export function serializeStyles(node: any): SerializedStyles {
  const styles: SerializedStyles = {};

  if ("fills" in node) {
    const fills = serializePaints(node.fills);
    if (fills !== undefined) styles.fills = fills;
  }

  if ("strokes" in node) {
    const strokes = serializePaints(node.strokes);
    if (strokes !== undefined) styles.strokes = strokes;
  }

  if ("cornerRadius" in node) {
    const cr = isMixed(node.cornerRadius) ? "mixed" : node.cornerRadius;
    if (cr !== 0) styles.cornerRadius = cr;
  }

  if ("paddingLeft" in node) {
    styles.padding = {
      top: node.paddingTop,
      right: node.paddingRight,
      bottom: node.paddingBottom,
      left: node.paddingLeft,
    };
  }

  return styles;
}

/**
 * Serialize line height.
 */
function serializeLineHeight(lineHeight: any): any {
  if (isMixed(lineHeight)) return "mixed";
  if (!lineHeight || lineHeight.unit === "AUTO") return undefined;
  return { value: lineHeight.value, unit: lineHeight.unit };
}

/**
 * Serialize letter spacing.
 */
function serializeLetterSpacing(letterSpacing: any): any {
  if (isMixed(letterSpacing)) return "mixed";
  if (!letterSpacing || letterSpacing.value === 0) return undefined;
  return { value: letterSpacing.value, unit: letterSpacing.unit };
}

/**
 * Serialize a TEXT node with typography properties.
 */
function serializeText(node: any, base: SerializedNode): SerializedNode {
  let fontFamily: any;
  let fontStyle: any;

  if (typeof node.fontName === "symbol") {
    fontFamily = "mixed";
    fontStyle = "mixed";
  } else if (node.fontName) {
    fontFamily = node.fontName.family;
    fontStyle = node.fontName.style;
  }

  const textStyles = {
    fontSize: isMixed(node.fontSize) ? "mixed" : node.fontSize,
    fontFamily,
    fontStyle,
    fontWeight: isMixed(node.fontWeight) ? "mixed" : node.fontWeight,
    textDecoration: isMixed(node.textDecoration)
      ? "mixed"
      : node.textDecoration !== "NONE"
        ? node.textDecoration
        : undefined,
    lineHeight: serializeLineHeight(node.lineHeight),
    letterSpacing: serializeLetterSpacing(node.letterSpacing),
    textAlignHorizontal: isMixed(node.textAlignHorizontal)
      ? "mixed"
      : node.textAlignHorizontal,
  };

  // Filter out undefined values
  const filteredTextStyles: SerializedStyles = {};
  for (const [key, value] of Object.entries(textStyles)) {
    if (value !== undefined) {
      filteredTextStyles[key] = value;
    }
  }

  return {
    ...base,
    characters: node.characters,
    styles: {
      ...base.styles,
      ...filteredTextStyles,
    },
  };
}

/**
 * Serialize a single node and its children recursively.
 * Note: This is async to match the Figma API async nature, even though mock tests use sync objects.
 */
export async function serializeNode(node: any): Promise<SerializedNode> {
  const styles = serializeStyles(node);

  const base: SerializedNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    styles,
  };

  if (node.bounds) {
    base.bounds = node.bounds;
  } else {
    const bounds = getBounds(node);
    if (bounds) base.bounds = bounds;
  }

  // TEXT nodes get special handling
  if (node.type === "TEXT") {
    return serializeText(node, base);
  }

  // Nodes with children
  if ("children" in node && Array.isArray(node.children)) {
    const serializedChildren = await Promise.all(
      node.children.map((child: any) => serializeNode(child)),
    );
    return {
      ...base,
      children: serializedChildren,
    };
  }

  return base;
}

/**
 * Deduplicate styles (fills/strokes) that appear multiple times in a tree.
 * Creates a globalVars object with shared style definitions.
 */
export function deduplicateStyles(tree: SerializedNode): DedupResult {
  const counts = new Map<string, number>();

  // Count occurrences of each fill/stroke array
  function countWalk(node: SerializedNode) {
    if (!node || typeof node !== "object") return;

    const s = node.styles;
    if (s) {
      if (Array.isArray(s.fills)) {
        const key = JSON.stringify(s.fills);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      if (Array.isArray(s.strokes)) {
        const key = JSON.stringify(s.strokes);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(countWalk);
    }
  }

  countWalk(tree);

  // Build dedup map: only create refs for entries that appear >1 time
  let counter = 0;
  const keyToRef = new Map<string, string>();
  const refs: { [key: string]: any } = {};

  for (const [key, count] of counts) {
    if (count > 1) {
      const ref = `s${++counter}`;
      keyToRef.set(key, ref);
      refs[ref] = JSON.parse(key);
    }
  }

  // If no dedup needed, return as-is
  if (keyToRef.size === 0) {
    return { tree, globalVars: undefined };
  }

  // Replace fills/strokes with refs
  function replaceWalk(node: SerializedNode): SerializedNode {
    if (!node || typeof node !== "object") return node;

    let result = node;
    const s = node.styles;

    if (s) {
      let newStyles = s;

      if (Array.isArray(s.fills)) {
        const ref = keyToRef.get(JSON.stringify(s.fills));
        if (ref) {
          newStyles = { ...newStyles, fills: ref };
        }
      }

      if (Array.isArray(s.strokes)) {
        const ref = keyToRef.get(JSON.stringify(s.strokes));
        if (ref) {
          newStyles = { ...newStyles, strokes: ref };
        }
      }

      if (newStyles !== s) {
        result = { ...node, styles: newStyles };
      }
    }

    if (Array.isArray(node.children)) {
      const newChildren = node.children.map(replaceWalk);
      result = { ...result, children: newChildren };
    }

    return result;
  }

  const dedupedTree = replaceWalk(tree);

  return {
    tree: dedupedTree,
    globalVars: { styles: refs },
  };
}

/**
 * Serialize a variable value, handling COLOR values and VARIABLE_ALIAS references.
 */
export function serializeVariableValue(value: any): any {
  if (typeof value !== "object" || value === null) return value;

  // Handle VARIABLE_ALIAS
  if ("type" in value && value.type === "VARIABLE_ALIAS") {
    return { type: "VARIABLE_ALIAS", id: value.id };
  }

  // Handle COLOR values
  if ("r" in value && "g" in value && "b" in value) {
    return {
      type: "COLOR",
      r: value.r,
      g: value.g,
      b: value.b,
      a: "a" in value ? value.a : 1,
    };
  }

  return value;
}
