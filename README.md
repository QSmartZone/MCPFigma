# MCP Figma Plugin

A Figma plugin implementing the WebSocket protocol for `@vkhanhqui/figma-mcp-go`, giving AI assistants (via MCP) live read/write access to a Figma file.

## Architecture

### Plugin Structure

**plugin/src/code.ts** — main thread (Figma sandbox)

- Receives `postMessage` from the UI iframe
- Dispatches requests via a handler registry (`plugin/src/dispatcher.ts`, pure TypeScript, no Figma imports)
- Calls Figma async APIs (`documentAccess: dynamic-page` mode):
  - `getNodeByIdAsync`, `loadAllPagesAsync`, `loadFontAsync`, `setCurrentPageAsync`
  - Async style/variable setters (`setFillStyleIdAsync`, `setStrokeStyleIdAsync`, etc.)
- Returns responses over `postMessage` to the UI

**plugin/src/ui.ts** / **plugin/dist/index.html** — UI iframe (browser context)

- Owns the WebSocket connection to `ws://{host}:{port}/ws` (default `127.0.0.1:1994`)
- Relays server requests to the main thread via `postMessage`
- Relays main-thread responses back over the socket
- Reconnects with exponential backoff (1s → 5s cap)
- Settings form (host/port) persisted via `figma.clientStorage`

### Protocol

Fixed protocol between plugin and Go server:

**Request** (from server):

```json
{
  "type": "command_name",
  "requestId": "string",
  "...flat params": "..."
}
```

**Success response**:

```json
{
  "type": "command_name",
  "requestId": "string",
  "data": { "...": "..." }
}
```

**Error response**:

```json
{
  "type": "command_name",
  "requestId": "string",
  "error": { "message": "error description" }
}
```

**Progress updates** (for long-running operations):

```json
{
  "type": "progress_update",
  "requestId": "string",
  "progress": 0.5,
  "message": "operation in progress"
}
```

### Handler Registry

72 total commands, organized by category. Handlers live in `plugin/src/handlers/{category}/` and registered in `plugin/src/handlers/index.ts`:

| Category       | Count | Handlers                                                                                                                                                                                                                                                                                                                                                |
| -------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **read**       | 20    | get_document, get_selection, get_node, get_nodes_info, get_metadata, get_pages, get_viewport, get_fonts, search_nodes, get_annotations, get_design_context, get_reactions, get_styles, get_variable_defs, get_local_components, export_tokens, scan_text_nodes, scan_nodes_by_types, get_screenshot, export_frames_to_pdf                               |
| **create**     | 7     | create_frame, create_rectangle, create_ellipse, create_text, import_image, create_component, create_section                                                                                                                                                                                                                                             |
| **modify**     | 24    | set_text, set_fills, set_strokes, rename_node, set_opacity, set_corner_radius, set_auto_layout, set_visible, set_blend_mode, set_constraints, set_effects, move_nodes, resize_nodes, clone_node, lock_nodes, unlock_nodes, rotate_nodes, reorder_nodes, reparent_nodes, batch_rename_nodes, find_replace_text, delete_nodes, group_nodes, ungroup_nodes |
| **styles**     | 7     | create_paint_style, create_text_style, create_effect_style, create_grid_style, update_paint_style, delete_style, apply_style_to_node                                                                                                                                                                                                                    |
| **variables**  | 6     | create_variable_collection, create_variable, set_variable_value, add_variable_mode, bind_variable_to_node, delete_variable                                                                                                                                                                                                                              |
| **components** | 2     | swap_component, detach_instance                                                                                                                                                                                                                                                                                                                         |
| **pages**      | 4     | add_page, delete_page, rename_page, navigate_to_page                                                                                                                                                                                                                                                                                                    |
| **prototype**  | 2     | set_reactions, remove_reactions                                                                                                                                                                                                                                                                                                                         |

## Install

```bash
git clone <repository-url>
cd mcp-figma
npm install
npm run build:plugin
```

Build output: `plugin/dist/code.js` (main thread) and `plugin/dist/index.html` (UI iframe, self-contained).

Then in Figma Desktop:

1. Menu → Plugins → Development → Import plugin from manifest...
2. Select `plugin/manifest.json` in this repository

## Server Setup

The plugin needs the companion Go MCP server running to receive commands:

```bash
npx -y @vkhanhqui/figma-mcp-go
```

This starts the server on `ws://127.0.0.1:1994/ws` by default — matching the plugin's default host/port.

Run the plugin in Figma Desktop; the UI panel shows connection status and allows changing the server host/port if it runs elsewhere.

## Build

```bash
npm run build:plugin
```

Single build script. Bundles `plugin/src/code.ts` → `plugin/dist/code.js` and `plugin/src/ui.ts` (inlined) → `plugin/dist/index.html` via esbuild.

Run tests (pure TypeScript, no Figma globals needed):

```bash
npm run test       # or: npx vitest run
```

Test suite covers dispatcher and serialize logic (19 tests).

## Adding a New Handler

1. **Create** handler file: `plugin/src/handlers/{category}/command-name.ts`

   ```ts
   export async function handleCommandName(params: any): Promise<Data> {
     // Call Figma async APIs
     // Return ONLY the raw data object (dispatcher wraps in response envelope)
     return { ... };
   }
   ```

2. **Match the spec**: Look up exact param names and `data` shape from the reference oracle in `/Users/ctquyen/Documents/project/self-project/MCP-self/MCP-figma-go/plugin/dist/code.js` (corresponding `case "command_name"` block). Match it exactly.

3. **Register** in `plugin/src/handlers/index.ts`:

   ```ts
   import { handleCommandName } from "./category/command-name";
   registerHandler("command_name", handleCommandName);
   ```

4. **Build and test**:

   ```bash
   npm run build:plugin
   npm run test
   ```

   Then manually test via Claude Code / MCP client against the running Go server.

## Tech Stack

- **Language:** TypeScript
- **Bundler:** esbuild
- **Plugin typings:** @figma/plugin-typings (v1.100+)
- **Tests:** vitest
- **Node:** >=18.0.0
