# MCP Figma

A self-hosted [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that exposes Figma design data to AI assistants via stdio transport. Extract design tokens, components, styles, layers, and metadata directly from your Figma files.

## Prerequisites

- **Node.js** >= 18.0.0
- **Figma Personal Access Token** — required to authenticate with the Figma API
  - Create one at [figma.com/developers/settings](https://www.figma.com/developers/settings)
  - Use an **Editor** token if you need access to design variables (otherwise **Viewer** token works for most tools)

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd mcp-figma
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root or set these in your shell environment:

```bash
# Required
FIGMA_TOKEN=your_personal_access_token_here

# Optional (defaults shown)
LOG_LEVEL=info
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FIGMA_TOKEN` | Yes | — | Figma Personal Access Token (Editor or Viewer) |
| `LOG_LEVEL` | No | `info` | Log level: `error`, `warn`, `info`, or `debug` |

### 3. Build (Optional)

For production, compile TypeScript:

```bash
npm run build
npm run start
```

For development with hot reload:

```bash
npm run dev
```

Or watch mode:

```bash
npm run watch
```

## Connecting to an MCP Client

### Claude Desktop

Add this server to your Claude Desktop configuration:

**macOS/Linux:** `~/.config/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "figma": {
      "command": "node",
      "args": ["/path/to/mcp-figma/dist/index.js"],
      "env": {
        "FIGMA_TOKEN": "your_token_here"
      }
    }
  }
}
```

Or use `npm run dev` for development:

```json
{
  "mcpServers": {
    "figma": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/path/to/mcp-figma",
      "env": {
        "FIGMA_TOKEN": "your_token_here"
      }
    }
  }
}
```

After updating the config, restart Claude Desktop. The Figma tools will appear in the assistant's tool list.

## Available Tools

All 17 tools are exposed through the MCP server. Node-level tools accept a `link` parameter that can be either:
- A full Figma URL: `https://www.figma.com/design/FILE_ID/...?node-id=1-127`
- A plain file ID: `FILE_ID`

### Node Tools

These tools extract data from a specific node (component, frame, shape, etc.) within a file.

| Tool | Input | Output |
|------|-------|--------|
| **get_node_context** | File ID + Node ID | Full design context (colors, typography, spacing, effects, children hierarchy) |
| **get_node_layers** | File ID + Node ID | Hierarchical layer tree starting from the node |
| **get_node_colors** | File ID + Node ID | All color fills and strokes applied to the node |
| **get_node_spacing** | File ID + Node ID | Layout info (padding, gap, constraints) |
| **get_node_text_content** | File ID + Node ID | All text content within the node |
| **get_node_assets** | File ID + Node ID | Image fills and asset references |
| **get_node_screenshot** | File ID + Node ID | Render the node as a PNG image |

### File Tools

These tools operate on the entire design file and return file-level resources.

| Tool | Input | Output |
|-------|-------|--------|
| **get_file_info** | File ID | File metadata (name, modified date, collaborators, owner) |
| **get_file_styles** | File ID | All design styles (colors, typography, effects, grid) |
| **get_file_text_styles** | File ID | Text styles only (font, weight, size, line height) |
| **get_file_color_styles** | File ID | Color styles only |
| **get_file_components** | File ID | All components in the file |
| **get_file_variables** | File ID | Design variables (requires Editor token) |
| **get_file_comments** | File ID | All comments in the file |

### Search & Navigation Tools

| Tool | Input | Output |
|------|-------|--------|
| **get_page_layers** | File ID + Page Name | Layer tree for an entire page |
| **search_nodes** | File ID + Query | Nodes matching name, type, or other criteria |
| **get_component** | Component Key | Component definition and metadata |

## Security & Validation

- All file and node IDs are validated using regex before API calls
- File IDs and node IDs in URLs are normalized (e.g., `1-23` → `1:23`) to match Figma API format
- File metadata is cached locally for 5 seconds to reduce API calls
- The `FIGMA_TOKEN` is never logged or exposed in error messages

## Troubleshooting

### "Editor token required" for Variables

`get_file_variables` requires an Editor-level Figma token. If you only have Viewer access, the tool will return an empty result.

### Node ID Format Mismatch

Figma uses `1:23` format internally but URLs encode them as `1-23`. The server normalizes both formats automatically.

## Project Structure

```
src/
├── index.ts                    # MCP server entry point
├── config.ts                   # Environment variable parsing
├── figma/
│   └── client.ts              # Figma REST API client with caching
├── security/
│   └── validator.ts           # File/node ID validation
├── tools/                      # Tool implementations (17 files)
│   ├── getNodeContext.ts
│   ├── getFileStyles.ts
│   └── ...
└── utils/
    └── designExtractor.ts      # Figma JSON parsing helpers
```

## Useful Links

- [MCP Specification](https://modelcontextprotocol.io/)
- [Figma REST API Docs](https://www.figma.com/developers/api)
- [Figma Access Tokens](https://www.figma.com/developers/settings)
