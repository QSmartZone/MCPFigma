import { describe, it, expect } from "vitest";
import { serializeNode, deduplicateStyles } from "../src/serialize";

// Mock Figma node types for testing
interface MockNode {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fills?: any[];
  strokes?: any[];
  cornerRadius?: number;
  children?: MockNode[];
  characters?: string;
  fontSize?: number;
  fontName?: { family: string; style: string };
  fontWeight?: number;
  textDecoration?: string;
  lineHeight?: any;
  letterSpacing?: any;
  textAlignHorizontal?: string;
  opacity?: number;
  visible?: boolean;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  fillStyleId?: string;
  strokeStyleId?: string;
  textStyleId?: string;
  reactions?: any[];
  annotations?: any[];
}

describe("serialize", () => {
  describe("serializeNode", () => {
    it("should serialize a basic node with id, name, type, bounds, and empty styles", async () => {
      const node: MockNode = {
        id: "frame-1",
        name: "Main Frame",
        type: "FRAME",
        x: 10.5,
        y: 20.75,
        width: 100.25,
        height: 200.5,
      };

      const result = await serializeNode(node);

      expect(result.id).toBe("frame-1");
      expect(result.name).toBe("Main Frame");
      expect(result.type).toBe("FRAME");
      expect(result.bounds).toEqual({
        x: 10.5,
        y: 20.75,
        width: 100.25,
        height: 200.5,
      });
      expect(result.styles).toEqual({});
    });

    it("should serialize a node with fills", async () => {
      const node: MockNode = {
        id: "rect-1",
        name: "Red Box",
        type: "RECTANGLE",
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        fills: [
          {
            type: "SOLID",
            color: { r: 1, g: 0, b: 0 },
            opacity: 1,
          },
        ],
      };

      const result = await serializeNode(node);

      expect(result.styles.fills).toBeDefined();
      expect(Array.isArray(result.styles.fills)).toBe(true);
      expect(result.styles.fills).toContain("#ff0000");
    });

    it("should serialize a node with fills and opacity", async () => {
      const node: MockNode = {
        id: "rect-2",
        name: "Semi Transparent",
        type: "RECTANGLE",
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        fills: [
          {
            type: "SOLID",
            color: { r: 0, g: 1, b: 0 },
            opacity: 0.5,
          },
        ],
      };

      const result = await serializeNode(node);

      expect(result.styles.fills).toBeDefined();
      expect(result.styles.fills).toContain("#00ff0080");
    });

    it("should serialize a TEXT node with text properties", async () => {
      const node: MockNode = {
        id: "text-1",
        name: "Heading",
        type: "TEXT",
        x: 0,
        y: 0,
        width: 200,
        height: 50,
        characters: "Hello World",
        fontSize: 32,
        fontName: { family: "Arial", style: "Bold" },
        fontWeight: 700,
        textAlignHorizontal: "CENTER",
      };

      const result = await serializeNode(node);

      expect(result.type).toBe("TEXT");
      expect(result.characters).toBe("Hello World");
      expect(result.styles.fontSize).toBe(32);
      expect(result.styles.fontFamily).toBe("Arial");
      expect(result.styles.fontStyle).toBe("Bold");
      expect(result.styles.fontWeight).toBe(700);
      expect(result.styles.textAlignHorizontal).toBe("CENTER");
    });

    it("should serialize a node with children recursively", async () => {
      const node: MockNode = {
        id: "group-1",
        name: "Group",
        type: "GROUP",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        children: [
          {
            id: "child-1",
            name: "Child 1",
            type: "RECTANGLE",
            x: 10,
            y: 10,
            width: 30,
            height: 30,
          },
          {
            id: "child-2",
            name: "Child 2",
            type: "RECTANGLE",
            x: 50,
            y: 50,
            width: 30,
            height: 30,
          },
        ],
      };

      const result = await serializeNode(node);

      expect(Array.isArray(result.children)).toBe(true);
      expect(result.children?.length).toBe(2);
      expect(result.children?.[0].id).toBe("child-1");
      expect(result.children?.[1].id).toBe("child-2");
    });
  });

  describe("deduplicateStyles", () => {
    it("should deduplicate fills when the same fill array appears multiple times", () => {
      const fillArray = [
        { r: 1, g: 0, b: 0 },
        { r: 0, g: 1, b: 0 },
      ];
      const tree = {
        id: "root",
        name: "Root",
        type: "FRAME",
        styles: {
          fills: fillArray,
        },
        children: [
          {
            id: "node-1",
            name: "Node 1",
            type: "RECTANGLE",
            styles: {
              fills: fillArray,
            },
          },
          {
            id: "node-2",
            name: "Node 2",
            type: "RECTANGLE",
            styles: {
              fills: fillArray,
            },
          },
        ],
      };

      const { tree: deduped, globalVars } = deduplicateStyles(tree);

      expect(globalVars).toBeDefined();
      expect(globalVars?.styles).toBeDefined();
      // The original fill arrays should be replaced with string refs
      expect(typeof deduped.styles.fills).toBe("string");
      expect(deduped.styles.fills).toMatch(/^s\d+$/);
      expect(deduped.children?.[0].styles.fills).toBe(deduped.styles.fills);
      expect(deduped.children?.[1].styles.fills).toBe(deduped.styles.fills);
    });

    it("should not deduplicate when a fill appears only once", () => {
      const tree = {
        id: "root",
        name: "Root",
        type: "FRAME",
        styles: {
          fills: ["#ff0000"],
        },
        children: [
          {
            id: "node-1",
            name: "Node 1",
            type: "RECTANGLE",
            styles: {
              fills: ["#00ff00"],
            },
          },
        ],
      };

      const { tree: deduped, globalVars } = deduplicateStyles(tree);

      expect(globalVars).toBeUndefined();
      expect(deduped.styles.fills).toEqual(["#ff0000"]);
      expect(deduped.children?.[0].styles.fills).toEqual(["#00ff00"]);
    });

    it("should deduplicate strokes separately from fills", () => {
      const fillArray = ["#ff0000"];
      const strokeArray = ["#0000ff"];

      const tree = {
        id: "root",
        name: "Root",
        type: "FRAME",
        styles: {
          fills: fillArray,
          strokes: strokeArray,
        },
        children: [
          {
            id: "node-1",
            name: "Node 1",
            type: "RECTANGLE",
            styles: {
              fills: fillArray,
              strokes: strokeArray,
            },
          },
          {
            id: "node-2",
            name: "Node 2",
            type: "RECTANGLE",
            styles: {
              fills: fillArray,
              strokes: strokeArray,
            },
          },
        ],
      };

      const { tree: deduped, globalVars } = deduplicateStyles(tree);

      expect(globalVars).toBeDefined();
      // Both fills and strokes should be deduplicated
      expect(
        Object.keys(globalVars?.styles || {}).length,
      ).toBeGreaterThanOrEqual(2);
    });

    it("should preserve globalVars structure with s1, s2 keys", () => {
      const fillArray = ["#ff0000"];

      const tree = {
        id: "root",
        name: "Root",
        type: "FRAME",
        styles: {
          fills: fillArray,
        },
        children: [
          {
            id: "node-1",
            name: "Node 1",
            type: "RECTANGLE",
            styles: {
              fills: fillArray,
            },
          },
        ],
      };

      const { tree: deduped, globalVars } = deduplicateStyles(tree);

      expect(globalVars?.styles).toBeDefined();
      const styleKeys = Object.keys(globalVars?.styles || {});
      expect(styleKeys.length).toBeGreaterThan(0);
      expect(styleKeys[0]).toMatch(/^s\d+$/);
      expect(globalVars?.styles?.[styleKeys[0]]).toEqual(fillArray);
    });
  });
});
