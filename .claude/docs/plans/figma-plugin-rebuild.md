# MCPFigma → Figma Plugin Rebuild (drop-in for figma-mcp-go)

**Date:** 2026-07-13
**Status:** Approved design

## Goal

Rebuild the Figma plugin from scratch with fully owned, self-modifiable TypeScript source, replacing the compiled-only plugin distributed in `MCP-figma-go/plugin/dist/`. The MCP server stays as the third-party Go binary `npx @vkhanhqui/figma-mcp-go` — untouched. The new plugin must be a drop-in replacement: it speaks the exact WebSocket protocol the Go server expects.

MCPFigma's existing REST-based MCP server (src/, 17 tools) is deleted entirely; the repo becomes a plugin-only project.

## Architecture

```
Claude Code ──stdio──> npx @vkhanhqui/figma-mcp-go   (Go server, reused as-is)
                          │  WebSocket ws://127.0.0.1:1994/ws
                          ▼
                   New plugin (TS source, this repo) ──figma.* API──> open Figma file
```

- Figma plugin main thread has no network access → the UI iframe owns the WebSocket and relays messages to/from the main thread via `postMessage` / `pluginMessage` — same mechanism as the original plugin.
- Plugin runs in Figma Desktop only, `documentAccess: dynamic-page`, `editorType: ["figma", "dev"]`.

## Repository Layout (after rebuild)

```
MCPFigma/
  plugin/
    manifest.json        ← identical content to MCP-figma-go's manifest
    src/
      code.ts            ← main thread: command dispatcher + handlers
      handlers/<group>/  ← one file per command handler, registered into dispatcher map
      serialize.ts       ← node serialization helpers (pure, unit-testable)
      ui.ts              ← iframe: WebSocket client, reconnect, postMessage relay, host/port settings
      ui.html            ← settings UI template
    dist/                ← build output: code.js + index.html
  package.json           ← single script: build:plugin (esbuild)
  tsconfig.json
```

Deleted: `src/` (REST server, 17 tools, figma client, validator, sanitize, designExtractor), deps `@modelcontextprotocol/sdk`, `axios`, `zod`, config `FIGMA_TOKEN`, scripts `build`/`start`/`dev`/`watch` (server-related).

## WebSocket Protocol (must match Go server exactly — verified against compiled plugin)

- Endpoint: `ws://{host}:{port}/ws`, default `127.0.0.1:1994`; host/port user-configurable in plugin UI, persisted via `figma.clientStorage`.
- Request (server → plugin): `{ type: "<command>", requestId, ...flat params }`
- Success (plugin → server): `{ type: "<same command>", requestId, data }`
- Error (plugin → server): `{ type, requestId, error: "<message>" }`
- Progress (long ops): `{ type: "progress_update", requestId, progress: <number>, message }`
- UI-internal messages (not sent to server): `ws_config`, `save_ws_config`, `get_ws_config` — settings round-trip between ui and main thread.
- Reconnect: UI iframe retries with backoff when the server is down; connection status shown in UI.
- One transport only. No HTTP, no alternative envelope, no additions to the protocol.

## Commands — 72, in 8 groups

Dispatcher is a registry map: `commandName → handler(request)`. Adding a command = adding one handler file that self-registers. Unknown command → error response `Unknown request type: <type>`.

| Group      | Count | Commands                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| read       | 20    | get_document, get_selection, get_node, get_nodes_info, get_design_context, get_metadata, get_pages, get_viewport, get_fonts, search_nodes, get_reactions, scan_text_nodes, scan_nodes_by_types, get_styles, get_variable_defs, get_local_components, get_annotations, export_tokens, get_screenshot, export_frames_to_pdf                               |
| create     | 7     | create_frame, create_rectangle, create_ellipse, create_text, import_image, create_component, create_section                                                                                                                                                                                                                                             |
| modify     | 24    | set_text, set_fills, set_strokes, set_effects, set_opacity, set_corner_radius, set_auto_layout, set_visible, set_blend_mode, set_constraints, move_nodes, resize_nodes, rotate_nodes, reorder_nodes, reparent_nodes, rename_node, batch_rename_nodes, find_replace_text, clone_node, delete_nodes, group_nodes, ungroup_nodes, lock_nodes, unlock_nodes |
| styles     | 7     | create_paint_style, create_text_style, create_effect_style, create_grid_style, update_paint_style, delete_style, apply_style_to_node                                                                                                                                                                                                                    |
| variables  | 6     | create_variable_collection, create_variable, set_variable_value, add_variable_mode, bind_variable_to_node, delete_variable                                                                                                                                                                                                                              |
| components | 2     | swap_component, detach_instance                                                                                                                                                                                                                                                                                                                         |
| pages      | 4     | add_page, delete_page, rename_page, navigate_to_page                                                                                                                                                                                                                                                                                                    |
| prototype  | 2     | set_reactions, remove_reactions                                                                                                                                                                                                                                                                                                                         |

Per-command `data` shape must match what the Go server expects. The compiled `MCP-figma-go/plugin/dist/code.js` is the reference source of truth for each command's request params and response shape — consult it during implementation of each handler.

`scan_text_nodes`, `scan_nodes_by_types`, `export_frames_to_pdf` emit `progress_update` messages before the final response.

## Build

- Single script `build:plugin`:
  - esbuild bundles `plugin/src/code.ts` → `plugin/dist/code.js` (ES target compatible with Figma's plugin sandbox)
  - `plugin/src/ui.ts` bundled and inlined into `plugin/dist/index.html`
- Dev deps: `esbuild`, `typescript`, `@figma/plugin-typings`, `vitest`.
- Import `plugin/manifest.json` into Figma Desktop once; rebuilds only require re-running the plugin.

## Error Handling

- Every handler wrapped in try/catch at the dispatcher level; any throw → `{ type, requestId, error: message }`. The plugin never crashes on a bad command.
- Node lookups use async API (`figma.getNodeByIdAsync`); missing node → `Node not found: <id>` error.
- Text mutations call `figma.loadFontAsync` for all fonts in range before editing.
- Write operations call `figma.commitUndo()` after batch mutations (matches original behavior).
- Large payloads (screenshots, PDF export) returned as base64 in `data`.

## Testing

- Unit (vitest): dispatcher (registration, unknown command, error wrapping, requestId echo), serialization helpers, and any pure logic not touching `figma.*`.
- Integration (manual smoke, in Figma Desktop against the real Go server): one representative command per group — get_selection, create_frame, set_fills, create_paint_style, create_variable, swap_component, add_page, set_reactions — plus one progress command (scan_text_nodes) and get_screenshot.
- Acceptance: Claude Code connected via `npx @vkhanhqui/figma-mcp-go` executes the smoke commands successfully with the new plugin active.

## Risks

- **Protocol drift:** the Go server is a black box; any mismatch in `data` shape breaks a tool silently. Mitigation: implement each handler against the compiled reference; smoke test per group against the real server.
- **dynamic-page access:** sync node APIs unavailable; all traversal must use async variants (`loadAllPagesAsync` before whole-document scans).
- **Fonts:** `set_text` / text creation fails without `loadFontAsync`; handlers must load fonts for every distinct font in the affected range.
