/**
 * get_design_context handler — returns current selection or page with depth-limited tree
 * and deduped styles. Supports detail levels (minimal/compact/full) and component deduping.
 */

import { Handler } from "../../dispatcher";
import {
  serializeNode,
  deduplicateStyles,
  isMixed,
  pixelRound,
  getBounds,
  toHex,
  serializePaints,
  serializeStyles,
} from "../../serialize";

export const handleGetDesignContext: Handler = async (params: any) => {
  const depth = params.depth != null ? params.depth : 2;
  const detail = params.detail || "full";
  const dedupeComponents = !!params.dedupeComponents;

  const componentDefs = new Map<string, any>();

  async function serializeForDetail(n: any): Promise<any> {
    const base = {
      id: n.id,
      name: n.name,
      type: n.type,
      bounds: getBounds(n),
    };

    if (detail === "minimal") return base;

    const styles = serializeStyles(n);
    const result = { ...base };
    if (Object.keys(styles).length > 0) result.styles = styles;
    if ("opacity" in n && n.opacity !== 1) result.opacity = n.opacity;
    if ("visible" in n && !n.visible) result.visible = false;

    if (detail === "compact") return result;

    return serializeNode(n);
  }

  async function extractInstanceOverrides(
    instanceNode: any,
    componentNode: any,
  ): Promise<any[]> {
    const overrides = [];
    if (!instanceNode?.children || !componentNode?.children) return overrides;

    for (let i = 0; i < instanceNode.children.length; i++) {
      const instChild = instanceNode.children[i];
      const compChild = componentNode.children[i];
      if (!instChild || !compChild) continue;

      const propChanges: any = {};
      if (
        "visible" in instChild &&
        "visible" in compChild &&
        instChild.visible !== compChild.visible
      ) {
        propChanges.visible = instChild.visible;
      }
      if (
        "opacity" in instChild &&
        "opacity" in compChild &&
        instChild.opacity !== compChild.opacity
      ) {
        propChanges.opacity = instChild.opacity;
      }
      if (
        "fills" in instChild &&
        "fills" in compChild &&
        !isMixed(instChild.fills) &&
        !isMixed(compChild.fills)
      ) {
        if (
          JSON.stringify(instChild.fills) !== JSON.stringify(compChild.fills)
        ) {
          propChanges.fills = instChild.fills;
        }
      }

      if (instChild.type === "TEXT") {
        const override: any = {
          id: instChild.id,
          name: instChild.name,
          type: "TEXT",
        };
        let hasChange = false;
        if (instChild.characters !== compChild.characters) {
          override.characters = instChild.characters;
          hasChange = true;
        }
        if (Object.keys(propChanges).length > 0) {
          Object.assign(override, propChanges);
          hasChange = true;
        }
        if (hasChange) overrides.push(override);
        continue;
      }

      if (instChild.type === "INSTANCE") {
        const [nestedMc, compMc] = await Promise.all([
          instChild.getMainComponentAsync(),
          compChild.type === "INSTANCE"
            ? compChild.getMainComponentAsync()
            : Promise.resolve(null),
        ]);
        if (nestedMc?.id !== compMc?.id) {
          const override: any = {
            id: instChild.id,
            name: instChild.name,
            type: "INSTANCE",
            mainComponentId: nestedMc?.id ?? null,
          };
          if (Object.keys(propChanges).length > 0) {
            Object.assign(override, propChanges);
          }
          overrides.push(override);
          continue;
        }

        if (Object.keys(propChanges).length > 0) {
          overrides.push({
            id: instChild.id,
            name: instChild.name,
            type: "INSTANCE",
            mainComponentId: nestedMc?.id ?? null,
            ...propChanges,
          });
        }

        if (nestedMc) {
          const nested = await extractInstanceOverrides(instChild, nestedMc);
          overrides.push(...nested);
        }
        continue;
      }

      if (Object.keys(propChanges).length > 0) {
        overrides.push({
          id: instChild.id,
          name: instChild.name,
          type: instChild.type,
          ...propChanges,
        });
      }

      if ("children" in instChild) {
        const nested = await extractInstanceOverrides(instChild, compChild);
        overrides.push(...nested);
      }
    }

    return overrides;
  }

  async function serializeWithDepth(
    node: any,
    currentDepth: number,
  ): Promise<any> {
    // Handle INSTANCE nodes with component deduping
    if (dedupeComponents && node.type === "INSTANCE") {
      const mc = await node.getMainComponentAsync();
      if (mc && !componentDefs.has(mc.id)) {
        componentDefs.set(mc.id, await serializeNode(mc));
      }

      const props: any = {};
      if (node.componentProperties) {
        for (const [key, prop] of Object.entries(node.componentProperties)) {
          props[key] = (prop as any).value;
        }
      }

      const result: any = {
        id: node.id,
        name: node.name,
        type: node.type,
        bounds: getBounds(node),
        mainComponentId: mc?.id ?? null,
      };
      if (Object.keys(props).length > 0) result.componentProperties = props;

      const overrides = await extractInstanceOverrides(node, mc);
      if (overrides.length > 0) result.overrides = overrides;

      return result;
    }

    // Handle full detail mode
    if (detail === "full") {
      const serialized = await serializeNode(node);
      if (currentDepth >= depth && serialized.children) {
        return {
          ...serialized,
          children: undefined,
          childCount: node.children ? node.children.length : 0,
        };
      }
      if (serialized.children) {
        const childNodes = await Promise.all(
          serialized.children.map((child: any) =>
            figma.getNodeByIdAsync(child.id),
          ),
        );
        const serializedChildren = await Promise.all(
          childNodes
            .filter((n: any) => n !== null && n.type !== "DOCUMENT")
            .map((n: any) => serializeWithDepth(n, currentDepth + 1)),
        );
        return { ...serialized, children: serializedChildren };
      }
      return serialized;
    }

    // Handle minimal/compact modes
    const serialized = await serializeForDetail(node);
    const hasChildren = "children" in node && node.children.length > 0;
    if (!hasChildren) return serialized;

    if (currentDepth >= depth) {
      return { ...serialized, childCount: node.children.length };
    }

    const serializedChildren = await Promise.all(
      node.children
        .filter((n: any) => n.type !== "DOCUMENT")
        .map((n: any) => serializeWithDepth(n, currentDepth + 1)),
    );
    return { ...serialized, children: serializedChildren };
  }

  const selection = figma.currentPage.selection;
  const rawContextNodes =
    selection.length > 0
      ? await Promise.all(selection.map((node) => serializeWithDepth(node, 0)))
      : [await serializeWithDepth(figma.currentPage, 0)];

  const { tree, globalVars } = deduplicateStyles({
    children: rawContextNodes,
  });
  const contextNodes = tree.children || [];

  const result: any = {
    fileName: figma.root.name,
    currentPage: {
      id: figma.currentPage.id,
      name: figma.currentPage.name,
    },
    selectionCount: selection.length,
    context: contextNodes,
  };

  if (componentDefs.size > 0) {
    result.componentDefs = Object.fromEntries(componentDefs);
  }

  if (globalVars) {
    result.globalVars = globalVars;
  }

  return result;
};
