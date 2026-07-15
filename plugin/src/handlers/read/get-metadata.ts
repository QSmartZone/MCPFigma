/**
 * get_metadata handler — returns file and page metadata.
 */

import { Handler } from "../../dispatcher";

export const handleGetMetadata: Handler = async (params: any) => {
  return {
    fileName: figma.root.name,
    currentPageId: figma.currentPage.id,
    currentPageName: figma.currentPage.name,
    pageCount: figma.root.children.length,
    pages: figma.root.children.map((page: any) => ({
      id: page.id,
      name: page.name,
    })),
  };
};
