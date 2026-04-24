export const FIGMA_API = "https://api.figma.com/v1";

export function getToken(): string {
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error("FIGMA_TOKEN not set in environment");
  return token;
}

export async function figmaGet<T>(path: string, token: string, retries = 4): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${FIGMA_API}${path}`, {
      headers: { "X-Figma-Token": token },
    });
    if (res.ok) return res.json() as Promise<T>;

    const body = await res.text();
    if (res.status === 429 && attempt < retries) {
      const retryAfter = res.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.min(1000 * 2 ** attempt, 16000);
      console.error(`Figma API 429 — retry ${attempt + 1}/${retries} in ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    lastError = new Error(`Figma API ${res.status}: ${body}`);
    break;
  }
  throw lastError!;
}

export function parseFileUrl(url: string): string {
  const m = url.match(/figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/);
  if (!m) throw new Error(`Cannot extract file key from URL: ${url}`);
  return m[1];
}

export function parseNodeUrl(url: string): { fileKey: string; nodeId: string } {
  const fileKey = parseFileUrl(url);
  const nm = url.match(/node-id=([^&\s]+)/);
  if (!nm) throw new Error(`No node-id in URL. Right-click a node → Copy link.`);
  // URL format: 1234-5678 → API format: 1234:5678
  const nodeId = decodeURIComponent(nm[1]).replace(/-/, ":");
  return { fileKey, nodeId };
}

export type FigmaNode = Record<string, unknown>;

export function extractBounds(node: FigmaNode) {
  const b = node.absoluteBoundingBox as Record<string, number> | undefined;
  if (!b) return null;
  return { x: b.x, y: b.y, width: b.width, height: b.height };
}

export function extractAutoLayout(node: FigmaNode) {
  if (!node.layoutMode) return null;
  return {
    mode: node.layoutMode,
    primaryAxisAlignItems: node.primaryAxisAlignItems,
    counterAxisAlignItems: node.counterAxisAlignItems,
    primaryAxisSizingMode: node.primaryAxisSizingMode,
    counterAxisSizingMode: node.counterAxisSizingMode,
    paddingTop: node.paddingTop ?? 0,
    paddingBottom: node.paddingBottom ?? 0,
    paddingLeft: node.paddingLeft ?? 0,
    paddingRight: node.paddingRight ?? 0,
    itemSpacing: node.itemSpacing ?? 0,
    counterAxisSpacing: node.counterAxisSpacing ?? null,
  };
}

export function extractTypography(node: FigmaNode) {
  if (node.type !== "TEXT") return null;
  const s = node.style as FigmaNode | undefined;
  return {
    characters: node.characters,
    fontFamily: s?.fontFamily,
    fontWeight: s?.fontWeight,
    fontStyle: s?.italic ? "italic" : "normal",
    fontSize: s?.fontSize,
    lineHeightPx: s?.lineHeightPx,
    lineHeightPercent: s?.lineHeightPercent,
    letterSpacing: s?.letterSpacing,
    textAlignHorizontal: s?.textAlignHorizontal,
    textAlignVertical: s?.textAlignVertical,
    textDecoration: s?.textDecoration,
    textCase: s?.textCase,
    styleOverrideTable: node.styleOverrideTable,
    characterStyleOverrides: node.characterStyleOverrides,
  };
}

export function extractFills(node: FigmaNode) {
  const fills = node.fills as FigmaNode[] | undefined;
  if (!fills?.length) return null;
  return fills
    .filter((f) => f.visible !== false)
    .map((f) => {
      const base: Record<string, unknown> = { type: f.type, opacity: f.opacity ?? 1 };
      if (f.color) {
        const c = f.color as Record<string, number>;
        base.hex = rgbaToHex(c.r, c.g, c.b, c.a ?? 1);
        base.rgba = {
          r: Math.round(c.r * 255),
          g: Math.round(c.g * 255),
          b: Math.round(c.b * 255),
          a: c.a ?? 1,
        };
      }
      if (f.gradientStops) base.gradientStops = f.gradientStops;
      if (f.imageRef) base.imageRef = f.imageRef;
      return base;
    });
}

export function extractStrokes(node: FigmaNode) {
  const strokes = node.strokes as FigmaNode[] | undefined;
  if (!strokes?.length) return null;
  return {
    strokes: strokes.map((s) => {
      const c = s.color as Record<string, number> | undefined;
      return {
        type: s.type,
        opacity: s.opacity ?? 1,
        ...(c ? { hex: rgbaToHex(c.r, c.g, c.b, c.a ?? 1) } : {}),
      };
    }),
    strokeWeight: node.strokeWeight,
    strokeAlign: node.strokeAlign,
    strokeDashes: node.strokeDashes ?? null,
  };
}

export function extractEffects(node: FigmaNode) {
  const effects = node.effects as FigmaNode[] | undefined;
  if (!effects?.length) return null;
  return effects
    .filter((e) => e.visible !== false)
    .map((e) => {
      const c = e.color as Record<string, number> | undefined;
      return {
        type: e.type,
        radius: e.radius,
        spread: e.spread ?? null,
        offset: e.offset,
        ...(c ? { color: rgbaToHex(c.r, c.g, c.b, c.a ?? 1) } : {}),
      };
    });
}

export function extractCorners(node: FigmaNode) {
  if (node.cornerRadius == null && !node.rectangleCornerRadii) return null;
  return {
    cornerRadius: node.cornerRadius ?? null,
    rectangleCornerRadii: node.rectangleCornerRadii ?? null,
  };
}

export function extractConstraints(node: FigmaNode) {
  return node.constraints ?? null;
}

export function extractComponentInfo(node: FigmaNode) {
  if (!node.componentId && node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") return null;
  return {
    type: node.type,
    componentId: node.componentId ?? null,
    componentProperties: node.componentProperties ?? null,
    overrides: node.overrides ?? null,
  };
}

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a < 1 ? `${hex}${toHex(a)}` : hex;
}

export function buildLayerTree(
  node: FigmaNode,
  depth = 0,
  maxDepth = 4,
  includeStyles = false
): unknown {
  const children = node.children as FigmaNode[] | undefined;
  const entry: Record<string, unknown> = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible !== false,
    locked: node.locked ?? false,
    bounds: extractBounds(node),
  };

  if (node.type === "TEXT") entry.text = node.characters;
  if (node.componentId) entry.componentId = node.componentId;
  if (node.styles) entry.styles = node.styles;

  if (includeStyles) {
    const fills = extractFills(node);
    if (fills) entry.fills = fills;
    const typography = extractTypography(node);
    if (typography) entry.typography = typography;
    const autoLayout = extractAutoLayout(node);
    if (autoLayout) entry.autoLayout = autoLayout;
  }

  if (children && depth < maxDepth) {
    entry.children = children.map((c) =>
      buildLayerTree(c, depth + 1, maxDepth, includeStyles)
    );
    entry.childCount = children.length;
  } else if (children) {
    entry.childCount = children.length;
    entry.children = "[truncated]";
  }

  return entry;
}

// Traverse all nodes and collect items matching predicate
export function traverseNodes(
  node: FigmaNode,
  collect: (n: FigmaNode) => boolean,
  results: FigmaNode[] = [],
  maxResults = 500
): FigmaNode[] {
  if (results.length >= maxResults) return results;
  if (collect(node)) results.push(node);
  const children = node.children as FigmaNode[] | undefined;
  if (children) {
    for (const child of children) {
      traverseNodes(child, collect, results, maxResults);
      if (results.length >= maxResults) break;
    }
  }
  return results;
}

// Collect all unique colors from a subtree
export function collectColors(node: FigmaNode): string[] {
  const seen = new Set<string>();
  traverseNodes(node, (n) => {
    const fills = n.fills as FigmaNode[] | undefined;
    if (fills) {
      for (const f of fills) {
        if (f.visible !== false && f.color) {
          const c = f.color as Record<string, number>;
          seen.add(rgbaToHex(c.r, c.g, c.b, c.a ?? 1));
        }
      }
    }
    return false;
  });
  return [...seen];
}

// Collect all text nodes from subtree
export function collectTextNodes(node: FigmaNode): FigmaNode[] {
  return traverseNodes(node, (n) => n.type === "TEXT");
}
