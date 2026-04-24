import { colorToHex } from "../figma/client.js";
import {
  TextStyle,
  ColorInfo,
  SpacingInfo,
  EffectInfo,
  ComponentInfo,
  NodeContext,
  TextNode,
  FigmaColor,
} from "../figma/types.js";

// ─── Typography ──────────────────────────────────────────────────────────────

export function extractTextStyle(node: Record<string, unknown>): TextStyle | null {
  const style = node.style as Record<string, unknown> | undefined;
  if (!style) return null;
  return {
    fontFamily: style.fontFamily as string | undefined,
    fontWeight: style.fontWeight as number | undefined,
    fontSize: style.fontSize as number | undefined,
    lineHeight: (style.lineHeightPx ?? style.lineHeightPercent ?? style.lineHeightUnit) as number | string | undefined,
    letterSpacing: style.letterSpacing as number | undefined,
    textCase: style.textCase as TextStyle["textCase"],
    textDecoration: style.textDecoration as TextStyle["textDecoration"],
    textAlignHorizontal: style.textAlignHorizontal as string | undefined,
    textAlignVertical: style.textAlignVertical as string | undefined,
  };
}

// ─── Colors ──────────────────────────────────────────────────────────────────

export function extractColors(node: Record<string, unknown>): ColorInfo[] {
  const results: ColorInfo[] = [];

  const fills = node.fills as Record<string, unknown>[] | undefined;
  if (fills) {
    for (const fill of fills) {
      if (fill.visible === false) continue;
      results.push(...parsePaint(fill, "fill"));
    }
  }

  const strokes = node.strokes as Record<string, unknown>[] | undefined;
  if (strokes) {
    for (const stroke of strokes) {
      if (stroke.visible === false) continue;
      results.push(...parsePaint(stroke, "stroke"));
    }
  }

  const bgColor = node.backgroundColor as FigmaColor | undefined;
  if (bgColor) {
    results.push({ type: "solid", hex: colorToHex(bgColor), usage: "background" });
  }

  return results;
}

function parsePaint(
  paint: Record<string, unknown>,
  usage: ColorInfo["usage"]
): ColorInfo[] {
  const results: ColorInfo[] = [];
  const paintType = paint.type as string;

  if (paintType === "SOLID") {
    const color = paint.color as FigmaColor | undefined;
    if (color) {
      results.push({
        type: "solid",
        hex: colorToHex(color),
        opacity: (paint.opacity as number | undefined) ?? color.a,
        usage,
      });
    }
  } else if (paintType?.startsWith("GRADIENT")) {
    const stops = (paint.gradientStops as Record<string, unknown>[] | undefined) ?? [];
    results.push({
      type: "gradient",
      gradientType: paintType,
      stops: stops.map((s) => ({
        position: s.position as number,
        hex: colorToHex(s.color as FigmaColor),
      })),
      usage,
    });
  } else if (paintType === "IMAGE") {
    results.push({ type: "image", usage });
  }

  return results;
}

// ─── Spacing / Layout ────────────────────────────────────────────────────────

export function extractSpacing(node: Record<string, unknown>): SpacingInfo {
  const bbox = node.absoluteBoundingBox as Record<string, unknown> | undefined;
  const sz = node.size as Record<string, unknown> | undefined;

  return {
    width: (sz?.width as number | undefined) ?? (bbox?.width as number | undefined),
    height: (sz?.height as number | undefined) ?? (bbox?.height as number | undefined),
    x: bbox?.x as number | undefined,
    y: bbox?.y as number | undefined,
    paddingTop: node.paddingTop as number | undefined,
    paddingBottom: node.paddingBottom as number | undefined,
    paddingLeft: node.paddingLeft as number | undefined,
    paddingRight: node.paddingRight as number | undefined,
    itemSpacing: node.itemSpacing as number | undefined,
    layoutMode: node.layoutMode as string | undefined,
    primaryAxisAlignItems: node.primaryAxisAlignItems as string | undefined,
    counterAxisAlignItems: node.counterAxisAlignItems as string | undefined,
    layoutWrap: node.layoutWrap as string | undefined,
    cornerRadius: node.cornerRadius as number | undefined ??
      ([
        node.topLeftRadius,
        node.topRightRadius,
        node.bottomRightRadius,
        node.bottomLeftRadius,
      ].some((v) => v != null)
        ? [
            (node.topLeftRadius as number) ?? 0,
            (node.topRightRadius as number) ?? 0,
            (node.bottomRightRadius as number) ?? 0,
            (node.bottomLeftRadius as number) ?? 0,
          ]
        : undefined),
    strokeWeight: node.strokeWeight as number | undefined,
    strokeAlign: node.strokeAlign as string | undefined,
    opacity: node.opacity as number | undefined,
    constraints: node.constraints as Record<string, unknown> | undefined,
  };
}

// ─── Effects ─────────────────────────────────────────────────────────────────

export function extractEffects(node: Record<string, unknown>): EffectInfo[] {
  const effects = node.effects as Record<string, unknown>[] | undefined;
  if (!effects) return [];
  return effects.map((e) => ({
    type: e.type as string,
    radius: e.radius as number | undefined,
    color: e.color ? colorToHex(e.color as FigmaColor) : undefined,
    offset: e.offset as { x: number; y: number } | undefined,
    spread: e.spread as number | undefined,
    visible: e.visible as boolean | undefined,
  }));
}

// ─── Component Info ──────────────────────────────────────────────────────────

export function extractComponentInfo(
  node: Record<string, unknown>
): ComponentInfo | null {
  if (node.type !== "INSTANCE") return null;
  return {
    componentId: node.componentId as string | undefined,
    componentSetId: node.componentSetId as string | undefined,
    overrides: node.overrides as Record<string, unknown>[] | undefined,
  };
}

// ─── Style References ────────────────────────────────────────────────────────

export function extractStyleRefs(
  node: Record<string, unknown>
): Record<string, string> {
  const styles = node.styles as Record<string, string> | undefined;
  return styles ?? {};
}

// ─── Deep node walker ────────────────────────────────────────────────────────

export function extractNodeContext(
  node: Record<string, unknown>,
  depth = 0,
  maxDepth = 20
): NodeContext {
  const ctx: NodeContext = {
    id: node.id as string,
    name: node.name as string,
    type: node.type as string,
    visible: node.visible as boolean | undefined,
    colors: extractColors(node),
    spacing: extractSpacing(node),
    effects: extractEffects(node),
    styleRefs: extractStyleRefs(node),
    exportSettings: node.exportSettings as unknown[] | undefined,
  };

  if (node.type === "TEXT") {
    ctx.text = node.characters as string | undefined;
    ctx.textStyle = extractTextStyle(node);
  }

  const componentInfo = extractComponentInfo(node);
  if (componentInfo) ctx.componentInfo = componentInfo;

  const children = node.children as Record<string, unknown>[] | undefined;
  if (children && depth < maxDepth) {
    ctx.children = children.map((c) => extractNodeContext(c, depth + 1, maxDepth));
  }

  return ctx;
}

// ─── Collect all text nodes ──────────────────────────────────────────────────

export function collectTextNodes(
  node: Record<string, unknown>,
  results: TextNode[] = []
): TextNode[] {
  if (node.type === "TEXT") {
    results.push({
      id: node.id as string,
      name: node.name as string,
      text: (node.characters as string) ?? "",
      style: extractTextStyle(node),
      colors: extractColors(node),
    });
  }
  const children = node.children as Record<string, unknown>[] | undefined;
  if (children) {
    for (const child of children) collectTextNodes(child, results);
  }
  return results;
}

// ─── Collect all unique colors ───────────────────────────────────────────────

export function collectAllColors(
  node: Record<string, unknown>,
  seen = new Set<string>(),
  results: ColorInfo[] = []
): ColorInfo[] {
  const colors = extractColors(node);
  for (const c of colors) {
    const key = c.hex ?? c.gradientType ?? "image";
    if (!seen.has(key)) {
      seen.add(key);
      results.push(c);
    }
  }
  const children = node.children as Record<string, unknown>[] | undefined;
  if (children) {
    for (const child of children) collectAllColors(child, seen, results);
  }
  return results;
}

// ─── Collect image fill refs ─────────────────────────────────────────────────

export function collectImageFillRefs(
  node: Record<string, unknown>,
  results: { nodeId: string; name: string; imageRef: string }[] = []
): typeof results {
  const fills = node.fills as Record<string, unknown>[] | undefined;
  if (fills) {
    for (const fill of fills) {
      if (fill.type === "IMAGE" && fill.imageRef) {
        results.push({
          nodeId: node.id as string,
          name: node.name as string,
          imageRef: fill.imageRef as string,
        });
      }
    }
  }
  const children = node.children as Record<string, unknown>[] | undefined;
  if (children) {
    for (const child of children) collectImageFillRefs(child, results);
  }
  return results;
}

// ─── Find node by id ─────────────────────────────────────────────────────────

export function findNodeById(
  root: Record<string, unknown>,
  targetId: string
): Record<string, unknown> | null {
  // Figma node IDs appear as "1:23" in the API but "1-23" in URLs; accept either form.
  const asColon = targetId.replace(/-/g, ":");
  const asHyphen = targetId.replace(/:/g, "-");

  function check(id: string): boolean {
    return id === asColon || id === asHyphen;
  }

  if (check(root.id as string)) return root;
  const children = root.children as Record<string, unknown>[] | undefined;
  if (children) {
    for (const child of children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
  }
  return null;
}

// ─── Search nodes by name / type ─────────────────────────────────────────────

export function searchNodes(
  root: Record<string, unknown>,
  query: string,
  byType?: string,
  results: { id: string; name: string; type: string; path: string[] }[] = [],
  path: string[] = []
): typeof results {
  const name = root.name as string;
  const type = root.type as string;
  const currentPath = [...path, name];
  const matchesName = !query || name.toLowerCase().includes(query.toLowerCase());
  const matchesType = !byType || type.toLowerCase() === byType.toLowerCase();

  if (matchesName && matchesType) {
    results.push({ id: root.id as string, name, type, path: currentPath });
  }

  const children = root.children as Record<string, unknown>[] | undefined;
  if (children) {
    for (const child of children) searchNodes(child, query, byType, results, currentPath);
  }
  return results;
}
