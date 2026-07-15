/**
 * helpers.ts for pages handlers — shared page resolution logic.
 */

/**
 * Resolve a page by pageId or pageName.
 * Throws if neither provided, or if page not found.
 */
export async function resolvePage(params: any): Promise<PageNode> {
  const p = params || {};

  if (p.pageId) {
    const found = await figma.getNodeByIdAsync(p.pageId);
    if (!found) {
      throw new Error(`Page not found: ${p.pageId}`);
    }
    if (found.type !== "PAGE") {
      throw new Error(`Node ${p.pageId} is not a PAGE`);
    }
    return found as PageNode;
  }

  if (p.pageName) {
    const page = figma.root.children.find((pg) => pg.name === p.pageName);
    if (!page) {
      throw new Error(`Page not found with name: ${p.pageName}`);
    }
    return page as PageNode;
  }

  throw new Error("pageId or pageName is required");
}
