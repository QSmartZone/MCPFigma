/**
 * Figma plugin UI iframe
 * Manages WebSocket connection to server and relays messages to/from main thread
 */

interface WebSocketConfig {
  host: string;
  port: number;
}

// State
let ws: WebSocket | null = null;
let wsConfig: WebSocketConfig = { host: "127.0.0.1", port: 1994 };
let reconnectBackoff = 1000; // Start at 1s
const MAX_BACKOFF = 5000; // Cap at 5s
let reconnectTimeout: number | null = null;
let isManualClose = false;

// UI elements
const statusDiv = document.getElementById("status")!;
const hostInput = document.getElementById("hostInput") as HTMLInputElement;
const portInput = document.getElementById("portInput") as HTMLInputElement;
const saveButton = document.getElementById("saveButton") as HTMLButtonElement;

function updateStatus(
  text: string,
  state: "connected" | "connecting" | "error" = "connecting",
) {
  statusDiv.textContent = text;
  statusDiv.className = state;
  console.log(`[UI] ${text}`);
}

function postToMainThread(message: any) {
  parent.postMessage({ pluginMessage: message }, "*");
}

/**
 * Connect to WebSocket server
 */
function connectWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
  }

  const url = `ws://${wsConfig.host}:${wsConfig.port}/ws`;
  console.log(`[UI] Connecting to ${url}`);
  updateStatus("Connecting…", "connecting");

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("[UI] WebSocket connected");
      updateStatus("Connected", "connected");
      reconnectBackoff = 1000; // Reset backoff on successful connection
      // Signal to main thread that UI is ready and WS is connected
      postToMainThread({ type: "ui-ready" });
    };

    ws.onmessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      console.log("[UI] Received from server:", message);

      // Forward to main thread as server-request
      postToMainThread({
        type: "server-request",
        payload: message,
      });
    };

    ws.onerror = (event: Event) => {
      console.error("[UI] WebSocket error:", event);
      updateStatus("Error", "error");
    };

    ws.onclose = () => {
      console.log("[UI] WebSocket closed");
      if (!isManualClose) {
        scheduleReconnect();
      } else {
        isManualClose = false;
      }
    };
  } catch (err) {
    console.error("[UI] Failed to create WebSocket:", err);
    updateStatus("Error", "error");
    if (!isManualClose) {
      scheduleReconnect();
    }
  }
}

/**
 * Schedule reconnection with exponential backoff
 */
function scheduleReconnect() {
  const delay = reconnectBackoff;
  reconnectBackoff = Math.min(reconnectBackoff * 2, MAX_BACKOFF);

  const delaySec = (delay / 1000).toFixed(1);
  updateStatus(`Disconnected — retrying in ${delaySec}s…`, "connecting");

  reconnectTimeout = window.setTimeout(() => {
    connectWebSocket();
  }, delay);
}

/**
 * Send data over WebSocket
 */
function sendOverWebSocket(data: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const json = JSON.stringify(data);
    console.log("[UI] Sending to server:", data);
    ws.send(json);
  } else {
    console.warn("[UI] WebSocket not open, message not sent:", data);
  }
}

/**
 * Handle messages from main thread
 */
window.onmessage = (event: MessageEvent) => {
  const message = event.data.pluginMessage;
  if (!message) return;

  console.log("[UI] Message from main thread:", message);

  // Handle ws_config reply
  if (message.type === "ws_config") {
    wsConfig = { host: message.host, port: message.port };
    console.log("[UI] Updated ws_config:", wsConfig);
    return;
  }

  // Handle dispatcher responses — forward back to server
  if (message.type && message.requestId !== undefined) {
    sendOverWebSocket(message);
    return;
  }

  // Other messages from main thread (shouldn't happen in normal flow)
  console.warn("[UI] Unexpected message from main thread:", message);
};

/**
 * Load settings from main thread and initialize UI
 */
function initializeSettings() {
  // Request ws_config from main thread (ui-ready will be sent when WS opens)
  postToMainThread({ type: "get_ws_config" });

  // Set up Save button
  saveButton.addEventListener("click", () => {
    const host = hostInput.value || "127.0.0.1";
    const port = parseInt(portInput.value || "1994", 10);

    if (isNaN(port) || port < 1 || port > 65535) {
      alert("Invalid port number (must be 1-65535)");
      return;
    }

    console.log("[UI] Saving ws_config:", { host, port });
    postToMainThread({
      type: "save_ws_config",
      host,
      port,
    });

    // Update local config and reconnect
    wsConfig = { host, port };
    reconnectBackoff = 1000; // Reset backoff
    connectWebSocket();
  });
}

/**
 * Update UI with current settings (should be called after ws_config is received)
 */
function syncSettingsUI() {
  hostInput.value = wsConfig.host;
  portInput.value = String(wsConfig.port);
}

// Initialize on load
console.log("[UI] Starting initialization");
updateStatus("Loading…", "connecting");
initializeSettings();

// Give main thread a moment to respond with ws_config
setTimeout(() => {
  syncSettingsUI();
  connectWebSocket();
}, 100);
