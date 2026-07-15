/**
 * get_viewport handler — returns viewport center, zoom, and bounds.
 */

import { Handler } from "../../dispatcher";

export const handleGetViewport: Handler = async (params: any) => {
  return {
    center: {
      x: figma.viewport.center.x,
      y: figma.viewport.center.y,
    },
    zoom: figma.viewport.zoom,
    bounds: {
      x: figma.viewport.bounds.x,
      y: figma.viewport.bounds.y,
      width: figma.viewport.bounds.width,
      height: figma.viewport.bounds.height,
    },
  };
};
