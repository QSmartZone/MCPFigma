/**
 * Figma plugin main thread
 * Handles UI messages, WebSocket server requests via dispatcher, and client storage
 */

import { createDispatcher } from "./dispatcher";
import "./handlers"; // Register all handlers (side-effect import)

console.log("Figma MCP plugin loaded");

// Create dispatcher instance
const dispatcher = createDispatcher();

// Show UI panel
figma.showUI(__html__, { width: 320, height: 230 });

/**
 * Handle messages from UI iframe
 */
figma.ui.onmessage = async (message: any) => {
  console.log("[Main] Message from UI:", message);

  // UI-ready signal — acknowledge
  if (message.type === "ui-ready") {
    console.log("[Main] UI is ready");
    return;
  }

  // Get WebSocket config from client storage
  if (message.type === "get_ws_config") {
    const config = (await figma.clientStorage.getAsync("ws_config")) as {
      host?: string;
      port?: number;
    } | null;
    figma.ui.postMessage({
      type: "ws_config",
      host: config?.host ?? "127.0.0.1",
      port: config?.port ?? 1994,
    });
    return;
  }

  // Save WebSocket config to client storage
  if (message.type === "save_ws_config") {
    await figma.clientStorage.setAsync("ws_config", {
      host: message.host,
      port: message.port,
    });
    console.log("[Main] Saved ws_config:", {
      host: message.host,
      port: message.port,
    });
    return;
  }

  // Server request — dispatch through handler registry
  if (message.type === "server-request") {
    const payload = message.payload;
    try {
      const response = await dispatcher.dispatch(payload);
      figma.ui.postMessage(response);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err || "Unknown error");
      figma.ui.postMessage({
        type: payload.type,
        requestId: payload.requestId,
        error: errorMessage,
      });
    }
    return;
  }

  console.warn("[Main] Unknown message type:", message.type);
};
