# Project Context — MCPFigma Plugin

## Architecture

Figma plugin (TypeScript, esbuild) that talks to a separate Go server (`@vkhanhqui/figma-mcp-go`) over WebSocket.

- **Main thread** (`plugin/src/code.ts`): receives messages from UI iframe, dispatches to handler registry, calls Figma async APIs, returns responses
- **UI iframe** (`plugin/src/ui.ts`): owns WebSocket to Go server, relays messages to/from main thread
- **Build**: `npm run build:plugin` bundles both via esbuild, inlines UI into HTML

## Tech Stack

- **Language**: TypeScript
- **Bundler**: esbuild (Figma sandbox compatible)
- **Typings**: @figma/plugin-typings (v1.100+)
- **Tests**: vitest (future)
- **Node**: >=18.0.0

## Protocol (fixed by spec)

Request: `{type, requestId, ...params}`
Success: `{type, requestId, data}`
Error: `{type, requestId, error: {message}}`
Progress: `{type: "progress_update", requestId, progress, message}`

Reference oracle: `/Users/ctquyen/Documents/project/self-project/MCP-self/MCP-figma-go/plugin/dist/code.js`

## DocumentAccess

Plugin runs with `"documentAccess": "dynamic-page"` — only async Figma APIs available:

- `getNodeByIdAsync`, `loadAllPagesAsync`, `loadFontAsync`
- `setCurrentPageAsync`, `setFillStyleIdAsync`, etc.

No synchronous node access or `currentPage` property.

## Handlers (72 total)

Organized by category in `plugin/src/handlers/`:

- `read/` — 20 handlers (get_document, get_selection, scan_text_nodes, get_screenshot, etc.)
- `create/` — 7 handlers (create_frame, create_text, import_image, etc.)
- `modify/` — 24 handlers (set_text, set_fills, move_nodes, delete_nodes, etc.)
- `styles/` — 7 handlers (create_paint_style, create_text_style, create_effect_style, create_grid_style, update_paint_style, delete_style, apply_style_to_node)
- `variables/` — 6 handlers (create_variable_collection, create_variable, set_variable_value, add_variable_mode, bind_variable_to_node, delete_variable)
- `components/` — 2 handlers (swap_component, detach_instance)
- `pages/` — 4 handlers (add_page, delete_page, rename_page, navigate_to_page)
- `prototype/` — 2 handlers (set_reactions, remove_reactions)

Registry in `plugin/src/handlers/index.ts` maps command type → handler function.

## Status

Tasks 1-11 complete: dispatcher, 72 handlers (read/create/modify/styles/variables/components/pages/prototype groups) registered and oracle-verified, WebSocket bridge. Build: `npm run build:plugin` → `plugin/dist/{code.js, index.html}` ✓. Next: Task 12 (full smoke + docs).
