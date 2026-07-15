/**
 * get_local_components handler — scans all pages for components and component sets.
 * Emits progress updates during scanning.
 */

import { Handler } from "../../dispatcher";

export const handleGetLocalComponents: Handler = async (params: any) => {
  const pages = figma.root.children;
  const allComponents: any[] = [];
  const componentSetsMap = new Map<string, any>();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    await page.loadAsync();

    const pageNodes = page.findAllWithCriteria({
      types: ["COMPONENT", "COMPONENT_SET"],
    });

    for (const n of pageNodes) {
      if (n.type === "COMPONENT_SET") {
        componentSetsMap.set(n.id, {
          id: n.id,
          name: n.name,
          key: "key" in n ? n.key : null,
        });
      } else {
        const parentIsSet = n.parent && n.parent.type === "COMPONENT_SET";
        allComponents.push({
          id: n.id,
          name: n.name,
          key: "key" in n ? n.key : null,
          componentSetId: parentIsSet ? n.parent.id : null,
          variantProperties:
            "variantProperties" in n ? n.variantProperties : null,
        });
      }
    }

    // Send progress update
    figma.ui.postMessage({
      type: "progress_update",
      requestId: params.requestId,
      progress: Math.round(((i + 1) / pages.length) * 90) + 1,
      message: `Scanned ${page.name}: ${allComponents.length} components so far`,
    });

    await new Promise((r) => setTimeout(r, 0));
  }

  return {
    count: allComponents.length,
    components: allComponents,
    componentSets: Array.from(componentSetsMap.values()),
  };
};
