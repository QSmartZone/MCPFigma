/**
 * navigate_to_page handler — navigates to a page by pageId or pageName.
 * Uses setCurrentPageAsync (async only, no commitUndo).
 */

import { Handler } from "../../dispatcher";
import { resolvePage } from "./helpers";

export const handleNavigateToPage: Handler = async (params: any) => {
  const p = params.params || {};

  const page = await resolvePage(p);

  await figma.setCurrentPageAsync(page);

  return { id: page.id, name: page.name };
};
