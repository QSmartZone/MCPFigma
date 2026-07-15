# CLAUDE.md

This file describes the Figma plugin implementation architecture and development workflow.

## Build & Run

```bash
npm install          # Install devDependencies
npm run build:plugin # Build plugin/src/ -> plugin/dist/ (TypeScript + esbuild)
```

Build output: `plugin/dist/code.js` (main thread) and `plugin/dist/index.html` (UI iframe, self-contained).

No server code in this repo. The plugin talks to a separate Go server (`@vkhanhqui/figma-mcp-go`) over WebSocket.

## Architecture

**Figma Plugin (this repo)**

- **plugin/src/code.ts** — main thread (Figma sandbox IIFE)
  - Receives messages from UI iframe
  - Dispatches commands to handler files via a registry (Task 2+)
  - Calls Figma async APIs (`figma.createFrame`, `figma.loadAllPagesAsync`, etc.)
  - Sends back success/error/progress responses
- **plugin/src/ui.ts** — iframe UI (browser context IIFE)
  - WebSocket connection to `ws://{host}:{port}/ws` (defaults `127.0.0.1:1994`)
  - Relays each incoming server message to main thread via `postMessage`
  - Relays main thread responses back over WebSocket
  - UI controls (settings form, status display)
- **plugin/dist/index.html** — self-contained HTML (build artifact)
  - ui.ts bundled and inlined as a single `<script>` tag

**Go Server (separate repo)**

- Listens on WebSocket
- Sends requests with `{type, requestId, ...params}`
- Plugin responds with `{type, requestId, data}` or `{type, requestId, error}`
- Long-running ops may emit `{type: "progress_update", requestId, progress, message}`

**Protocol** (fixed by spec — defined in `/Users/ctquyen/Documents/project/self-project/MCP-self/MCP-figma-go/plugin/dist/code.js`)

- Success: `{type: string, requestId: string, data: object}`
- Error: `{type: string, requestId: string, error: {message: string, code?: string}}`
- Progress: `{type: "progress_update", requestId: string, progress: number, message: string}`

## Handler Structure (Task 2+)

Registry maps command type → handler file. Each handler:

```ts
export async function handleXyz(params: XyzParams): Promise<XyzData> {
  // Call figma.* APIs
  // Return data matching spec (reference oracle: MCP-figma-go/plugin/dist/code.js)
}
```

Handlers live in `plugin/src/handlers/{read,create,modify,styles,variables,components,pages,prototype}/`.

## Tech Stack

- **Language:** TypeScript
- **Bundler:** esbuild (no webpack/vite for Figma sandbox compatibility)
- **Plugin typings:** @figma/plugin-typings (v1.100+)
- **Tests:** vitest (Task 2+ when tests are written)
- **Node version:** >=18.0.0

## Project Status

**Task 1** (current): Scaffold — repo cleaned, build pipeline working, stubs in place.

**Task 2+**: Dispatcher, handlers (72 commands), WebSocket bridge, testing.

See `.claude/docs/plans/figma-plugin-rebuild-plan.md` for full task breakdown.

## Adding a New Handler

1. Create handler file under `plugin/src/handlers/{category}/commandName.ts`
2. Export `async function handle{CommandName}(params): Promise<Data>`
3. Call Figma APIs; match reference oracle data shape from `MCP-figma-go/plugin/dist/code.js` case block
4. Register in `plugin/src/handlers/index.ts` registry
5. Run `npm run build:plugin` and test via Claude Code

## DocumentAccess Mode

Plugin runs with `"documentAccess": "dynamic-page"` — only async Figma APIs are available:

- `getNodeByIdAsync`
- `loadAllPagesAsync` (before traversing entire document)
- `loadFontAsync` (before text mutations)
- `setCurrentPageAsync` (navigate)
- Async setters: `setFillStyleIdAsync`, `setStrokeStyleIdAsync`, etc.

No synchronous `getNodeById` or direct `currentPage` access. Plan for async throughout.
