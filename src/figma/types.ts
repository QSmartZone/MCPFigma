// ─── Link parsing ─────────────────────────────────────────────────────────────

export interface FigmaLinkParsed {
  fileId: string;
  nodeId: string | null;
}

// ─── Color ────────────────────────────────────────────────────────────────────

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

// ─── Node summary ─────────────────────────────────────────────────────────────

export interface FigmaNodeSummary {
  id: string;
  name: string;
  type: string;
  children?: FigmaNodeSummary[];
}

// ─── Typography ───────────────────────────────────────────────────────────────

export interface TextStyle {
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  lineHeight?: number | string;
  letterSpacing?: number;
  textCase?: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
  textDecoration?: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
  textAlignHorizontal?: string;
  textAlignVertical?: string;
}

// ─── Colors ───────────────────────────────────────────────────────────────────

export interface ColorInfo {
  type: "solid" | "gradient" | "image";
  hex?: string;
  opacity?: number;
  gradientType?: string;
  stops?: { position: number; hex: string }[];
  usage: "fill" | "stroke" | "background" | "effect";
}

// ─── Spacing / Layout ─────────────────────────────────────────────────────────

export interface SpacingInfo {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  itemSpacing?: number;
  layoutMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  layoutWrap?: string;
  cornerRadius?: number | number[];
  strokeWeight?: number;
  strokeAlign?: string;
  opacity?: number;
  constraints?: Record<string, unknown>;
}

// ─── Effects ──────────────────────────────────────────────────────────────────

export interface EffectInfo {
  type: string;
  radius?: number;
  color?: string;
  offset?: { x: number; y: number };
  spread?: number;
  visible?: boolean;
}

// ─── Component Info ───────────────────────────────────────────────────────────

export interface ComponentInfo {
  componentId?: string;
  componentSetId?: string;
  overrides?: Record<string, unknown>[];
}

// ─── Node context (deep) ──────────────────────────────────────────────────────

export interface NodeContext {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  text?: string;
  textStyle?: TextStyle | null;
  colors: ColorInfo[];
  spacing: SpacingInfo;
  effects: EffectInfo[];
  styleRefs: Record<string, string>;
  componentInfo?: ComponentInfo | null;
  exportSettings?: unknown[];
  children?: NodeContext[];
}

// ─── Text node (flattened) ────────────────────────────────────────────────────

export interface TextNode {
  id: string;
  name: string;
  text: string;
  style: TextStyle | null;
  colors: ColorInfo[];
}
