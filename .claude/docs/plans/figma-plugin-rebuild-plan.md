# Figma Plugin Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Per `rules/writing-plans-policy.md`: this plan contains no code. Implementers write code at execution time, using the spec (`figma-plugin-rebuild.md`) and the compiled reference plugin as sources of truth.

**Goal:** Rebuild the Figma plugin as owned TypeScript source in MCPFigma, drop-in compatible with the `@vkhanhqui/figma-mcp-go` Go server.

**Architecture:** UI iframe owns the WebSocket to `ws://{host}:{port}/ws` and relays messages to the main thread via postMessage; main thread runs a registry dispatcher mapping 72 command types to handler files calling `figma.*` async APIs.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, vitest.

## Global Constraints

- Protocol shapes fixed by spec §"WebSocket Protocol" — request `{type, requestId, ...flat params}`, success `{type, requestId, data}`, error `{type, requestId, error}`, progress `{type: "progress_update", requestId, progress, message}`. Never invent new envelope fields.
- Reference oracle for every command's params and `data` shape: `/Users/ctquyen/Documents/project/self-project/MCP-self/MCP-figma-go/plugin/dist/code.js` (compiled original). Read the relevant `case "<command>"` block before implementing each handler.
- `documentAccess: dynamic-page` → async APIs only (`getNodeByIdAsync`, `loadAllPagesAsync` before whole-document traversal).
- Text mutations must `loadFontAsync` every distinct font in the affected range first.
- Single build script `build:plugin`; no server code, no second transport.
- Commits: HITL per `rules/git-commit.md` — draft message, ask user, never auto-commit. No Co-Authored-By.
- All code, comments, README in English.

---

### Task 1: Teardown + project scaffold

**Files:**

- Delete: `src/` (entire REST server), `mcp-config-example.json`
- Modify: `package.json`, `tsconfig.json`, `.gitignore`, `CLAUDE.md`
- Create: `plugin/manifest.json`, `plugin/src/code.ts`, `plugin/src/ui.ts`, `plugin/src/ui.html`, `scripts/build.mjs` (esbuild driver)

**Steps:**

- [ ] Delete `src/` and remove deps `@modelcontextprotocol/sdk`, `axios`, `zod`; remove scripts `build`, `start`, `dev`, `watch`
- [ ] Add devDeps `esbuild`, `@figma/plugin-typings`, `vitest`; add single script `build:plugin` running `scripts/build.mjs`
- [ ] Copy manifest content verbatim from `MCP-figma-go/plugin/manifest.json` (change only `name`/`id` if user later asks — default keep identical for drop-in)
- [ ] Build driver: bundle `code.ts` → `plugin/dist/code.js`; bundle `ui.ts` and inline into `ui.html` → `plugin/dist/index.html`
- [ ] Stub `code.ts` (shows UI, logs) and `ui.ts`/`ui.html` (empty shell) so build succeeds end to end
- [ ] Update `tsconfig.json` for plugin typings; update `CLAUDE.md` to describe new project shape
- [ ] Run `npm run build:plugin` → both dist files produced

**Acceptance:** `build:plugin` exits 0 and emits `plugin/dist/code.js` + `plugin/dist/index.html`; repo has no REST server code left.

### Task 2: Dispatcher core + test harness

**Files:**

- Create: `plugin/src/dispatcher.ts`, `plugin/src/handlers/index.ts` (registry), `plugin/src/serialize.ts`
- Test: `plugin/test/dispatcher.test.ts`
- Modify: `plugin/src/code.ts`

**Steps:**

- [ ] Write failing vitest specs: handler registration; dispatch echoes `type` + `requestId`; handler throw → error response with message; unknown type → `Unknown request type: <type>` error; run to confirm fail
- [ ] Implement registry map + dispatch wrapper satisfying the specs (pure, no `figma.*` import so it is testable in Node)
- [ ] `code.ts`: wire `figma.ui.onmessage` → dispatcher → post result back to UI
- [ ] Run `npx vitest run` → pass; run `build:plugin` → pass

**Acceptance:** vitest green; dispatcher enforces protocol envelope for success/error/unknown.

### Task 3: UI iframe WebSocket bridge + settings

**Files:**

- Modify: `plugin/src/ui.ts`, `plugin/src/ui.html`, `plugin/src/code.ts`

**Steps:**

- [ ] UI connects to `ws://{host}:{port}/ws` (defaults `127.0.0.1:1994`), forwards each incoming server message to main thread, forwards each main-thread response/progress back over WS
- [ ] Reconnect with backoff (1s→5s cap) on close/error; visible connection status in `ui.html`
- [ ] Settings: host/port form in UI; main thread persists via `figma.clientStorage`; implement UI-internal messages `get_ws_config`/`ws_config`/`save_ws_config` matching original names
- [ ] Manual check: `build:plugin`, import manifest in Figma Desktop, run plugin with Go server started via `npx -y @vkhanhqui/figma-mcp-go` → status shows connected

**Acceptance:** plugin connects to real Go server, survives server restart via reconnect, settings persist across plugin restarts.

### Task 4: read group — basic document reads (10 handlers)

**Files:**

- Create: `plugin/src/handlers/read/` — one file per command: get_document, get_selection, get_node, get_nodes_info, get_metadata, get_pages, get_viewport, get_fonts, search_nodes, get_annotations
- Test: `plugin/test/serialize.test.ts`
- Modify: `plugin/src/serialize.ts`

**Steps:**

- [ ] For each command: read its `case` block in the reference `dist/code.js`, implement handler returning identical `data` shape
- [ ] Port node serialization + style-dedup (`globalVars`) logic into `serialize.ts`; unit-test pure parts (dedup, shape) with fixture objects
- [ ] Register all 10 in `handlers/index.ts`; vitest + build green
- [ ] Manual smoke in Figma Desktop through Claude Code: `get_selection`, `get_node`, `get_document` return sensible data

**Acceptance:** 10 handlers registered, smoke reads succeed end-to-end against real server.

### Task 5: read group — design context, styles, variables, components, tokens (7 handlers)

**Files:**

- Create: `plugin/src/handlers/read/` — get_design_context, get_styles, get_variable_defs, get_local_components, export_tokens, get_reactions + shared helpers as needed

**Steps:**

- [ ] Implement each against reference `case` blocks; reuse `serialize.ts` for node trees
- [ ] `get_design_context` returns fileName + currentPage + deduped context nodes per reference
- [ ] Register; vitest + build green; smoke `get_styles` and `get_design_context` via Claude Code

**Acceptance:** design-context and library reads match reference shapes; smoke passes.

### Task 6: read group — progress + binary ops (3 handlers)

**Files:**

- Create: `plugin/src/handlers/read/` — scan_text_nodes, scan_nodes_by_types, get_screenshot, export_frames_to_pdf

**Steps:**

- [ ] Implement `progress_update` emission path from handlers through dispatcher → UI → WS (progress does not terminate the request)
- [ ] scan handlers use `loadAllPagesAsync` when scanning beyond current page, per reference behavior
- [ ] get_screenshot / export_frames_to_pdf return base64 via `exportAsync`, params (scale/format) per reference
- [ ] Smoke: scan_text_nodes on a page with text (progress visible), get_screenshot of a frame renders in Claude Code

**Acceptance:** long ops stream progress then a final result; screenshot/PDF payloads decode correctly.

### Task 7: create group (7 handlers)

**Files:**

- Create: `plugin/src/handlers/create/` — create_frame, create_rectangle, create_ellipse, create_text, import_image, create_component, create_section

**Steps:**

- [ ] Implement each per reference params (position, size, fills, parent); create_text loads font before setting characters
- [ ] import_image via `figma.createImage` from base64 bytes
- [ ] Register; build green; smoke `create_frame` + `create_text` via Claude Code, verify nodes appear in canvas

**Acceptance:** created nodes match requested props; ids returned in `data` usable by follow-up commands.

### Task 8: modify group — property setters (13 handlers)

**Files:**

- Create: `plugin/src/handlers/modify/` — set_text, set_fills, set_strokes, set_effects, set_opacity, set_corner_radius, set_auto_layout, set_visible, set_blend_mode, set_constraints, rename_node, set_reactions is NOT here (prototype group)
- Note: shared multi-node resolution helper (accept nodeId/nodeIds, async lookup, not-found error)

**Steps:**

- [ ] Implement setters per reference shapes; set_text loads all fonts in range first; batch ops end with `commitUndo`
- [ ] Register; build green; smoke `set_fills` + `set_text` on nodes created in Task 7

**Acceptance:** setters mutate canvas correctly and return reference-shaped `data`.

### Task 9: modify group — structural ops (11 handlers)

**Files:**

- Create: `plugin/src/handlers/modify/` — move_nodes, resize_nodes, rotate_nodes, reorder_nodes, reparent_nodes, batch_rename_nodes, find_replace_text, clone_node, delete_nodes, group_nodes, ungroup_nodes, lock_nodes, unlock_nodes

**Steps:**

- [ ] Implement per reference; find_replace_text returns `{replaced, results}` counting non-error results per reference
- [ ] Register; build green; smoke `group_nodes` + `delete_nodes`

**Acceptance:** structural ops behave per reference; undo works (commitUndo present).

### Task 10: styles + variables groups (13 handlers)

**Files:**

- Create: `plugin/src/handlers/styles/` — create_paint_style, create_text_style, create_effect_style, create_grid_style, update_paint_style, delete_style, apply_style_to_node
- Create: `plugin/src/handlers/variables/` — create_variable_collection, create_variable, set_variable_value, add_variable_mode, bind_variable_to_node, delete_variable

**Steps:**

- [ ] Implement per reference; style application uses async setters (`setFillStyleIdAsync` family) under dynamic-page
- [ ] Variables via `figma.variables.*` API; bind uses `setBoundVariable` per property key from params
- [ ] Register; build green; smoke `create_paint_style` + `create_variable` + `bind_variable_to_node`

**Acceptance:** styles/variables appear in Figma UI panels and bindings resolve on canvas.

### Task 11: components + pages + prototype groups (8 handlers)

**Files:**

- Create: `plugin/src/handlers/components/` — swap_component, detach_instance
- Create: `plugin/src/handlers/pages/` — add_page, delete_page, rename_page, navigate_to_page
- Create: `plugin/src/handlers/prototype/` — set_reactions, remove_reactions

**Steps:**

- [ ] Implement per reference; navigate_to_page uses `setCurrentPageAsync`; reactions via `setReactionsAsync` with reference-shaped triggers/actions
- [ ] Register; confirm registry now holds all 72 commands (assert count in dispatcher test)
- [ ] Build green; smoke `add_page` + `swap_component` + `set_reactions`

**Acceptance:** all 72 commands registered (test-asserted); smoke passes.

### Task 12: full smoke + docs

**Files:**

- Modify: `README.md`
- Test: manual checklist

**Steps:**

- [ ] Full manual smoke against real Go server via Claude Code: one command per group (get_selection, create_frame, set_fills, create_paint_style, create_variable, swap_component, add_page, set_reactions) + scan_text_nodes (progress) + get_screenshot
- [ ] Fix any `data`-shape mismatches found (reference `dist/code.js` decides)
- [ ] Rewrite `README.md`: architecture, install (import manifest), server setup via npx, build:plugin, adding a new command (one handler file + register)
- [ ] Present task report table per CLAUDE.md; draft commit message and ask user (HITL)

**Acceptance:** smoke checklist fully green; README accurate; user sign-off.

## Self-Review Notes

- Spec coverage: teardown (T1), build (T1), protocol+bridge (T2–T3), 72 commands (T4–T11: 20+7+24+7+6+2+4+2 = 72), testing (T2, per-task smoke, T12), README (T12) — no gaps.
- Registry count assertion in T11 guards against a forgotten handler.
- No code blocks per writing-plans-policy; reference oracle named with exact path in Global Constraints.
