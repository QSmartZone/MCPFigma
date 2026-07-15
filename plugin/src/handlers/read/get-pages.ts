/**
 * get_pages handler — returns list of all pages.
 */

import { Handler } from "../../dispatcher";

export const handleGetPages: Handler = async (params: any) => {
  return {
    currentPageId: figma.currentPage.id,
    pages: figma.root.children.map((page: any) => ({
      id: page.id,
      name: page.name,
    })),
  };
};
