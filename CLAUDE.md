# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build      # tsc → dist/
npm run dev        # run via tsx (no build needed)
npm run watch      # tsc --watch
npm run start      # run compiled dist/index.js
```

No test runner configured. No lint script defined.

**Required env var:** `FIGMA_TOKEN` must be set. Optional: `LOG_LEVEL` (error|warn|info|debug, default info).

## Architecture

MCP server over stdio transport. Each tool is a self-contained module in `src/tools/` with a consistent shape:

```ts
export const xTool = { name, description, schema: ZodObject, handler: async (params) => MCP content[] }
```

`src/index.ts` imports all tools, registers them on `McpServer` in a loop, wraps each handler in try/catch that serializes errors as JSON text content.

**Key singletons** (must be initialized before tools run):
- `FigmaClient` — `src/figma/client.ts` — wraps Figma REST API via axios, holds auth token
- File cache — 5-second TTL map inside `client.ts`, shared via `getCachedFile(fileId)`

**Request flow for node tools:**
1. `parseFigmaLink()` (`src/security/validator.ts`) — extracts `fileId` + `nodeId` from URL or bare ID, validates format with regex
2. `getCachedFile(fileId)` — fetches full file JSON, caches 5s
3. `findNodeById()` (`src/utils/designExtractor.ts`) — DFS walk; accepts both `1:23` and `1-23` node ID formats
4. Extraction helpers in `designExtractor.ts` pull colors, spacing, typography, effects, component info from raw Figma node JSON

**Tool categories:**
- `getNode*` — operate on a specific node within a file (require `link` param with node-id)
- `getFile*` — operate on file-level resources (styles, components, variables, comments)
- `getPage*` / `searchNodes` / `getComponent` — broader queries

**Node ID gotcha:** Figma API returns IDs as `"1:23"`, URLs encode them as `"1-23"`. `findNodeById` and `parseFigmaLink` both normalize between the two forms.

**Variables endpoint** silently returns `{}` for Viewer-level tokens (Editor access required); handled in `FigmaClient.getFileVariables`.
