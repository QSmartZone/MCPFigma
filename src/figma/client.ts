import axios, { AxiosInstance } from "axios";
import { FigmaColor, FigmaNodeSummary } from "./types.js";

const FILE_CACHE_TTL_MS = 5000;
const fileCache = new Map<string, { data: Record<string, unknown>; time: number }>();

// ─── Singleton client ─────────────────────────────────────────────────────────

let globalClient: FigmaClient | null = null;

export function initializeFigmaClient(token: string): FigmaClient {
  globalClient = new FigmaClient(token);
  return globalClient;
}

export function getFigmaClient(): FigmaClient {
  if (!globalClient) {
    throw new Error("FigmaClient not initialized. Call initializeFigmaClient() first.");
  }
  return globalClient;
}

// ─── Cache helper ────────────────────────────────────────────────────────────

export async function getCachedFile(fileId: string): Promise<Record<string, unknown>> {
  const cached = fileCache.get(fileId);
  if (cached && Date.now() - cached.time < FILE_CACHE_TTL_MS) {
    return cached.data;
  }
  const client = getFigmaClient();
  const data = await client.getFile(fileId);
  fileCache.set(fileId, { data, time: Date.now() });
  return data;
}

// ─── Color conversion ─────────────────────────────────────────────────────────

export function colorToHex(color: FigmaColor): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  return color.a < 1
    ? `${hex} (opacity: ${Math.round(color.a * 100)}%)`
    : hex;
}

// ─── Node summarization ───────────────────────────────────────────────────────

export function summarizeNode(node: Record<string, unknown>, depth = 0, maxDepth = 10): FigmaNodeSummary {
  const summary: FigmaNodeSummary = {
    id: node.id as string,
    name: node.name as string,
    type: node.type as string,
  };
  const children = node.children as Record<string, unknown>[] | undefined;
  if (children && depth < maxDepth) {
    summary.children = children.map((c) => summarizeNode(c, depth + 1, maxDepth));
  }
  return summary;
}

// ─── FigmaClient class ────────────────────────────────────────────────────────

export class FigmaClient {
  private http: AxiosInstance;

  constructor(token: string) {
    this.http = axios.create({
      baseURL: "https://api.figma.com/v1",
      headers: { "X-Figma-Token": token },
      timeout: 30000,
    });
  }

  async getFile(fileId: string): Promise<Record<string, unknown>> {
    const res = await this.http.get(`/files/${fileId}`);
    return res.data;
  }

  async getFileNodes(
    fileId: string,
    nodeIds: string[]
  ): Promise<Record<string, unknown>> {
    const ids = nodeIds.map((id) => id.replace(/-/g, ":")).join(",");
    const res = await this.http.get(`/files/${fileId}/nodes`, {
      params: { ids },
    });
    return res.data;
  }

  async getFileStyles(fileId: string): Promise<Record<string, unknown>> {
    const res = await this.http.get(`/files/${fileId}/styles`);
    return res.data;
  }

  async getFileComponents(fileId: string): Promise<Record<string, unknown>> {
    const res = await this.http.get(`/files/${fileId}/components`);
    return res.data;
  }

  async getFileComponentSets(
    fileId: string
  ): Promise<Record<string, unknown>> {
    const res = await this.http.get(`/files/${fileId}/component_sets`);
    return res.data;
  }

  async getImageFills(fileId: string): Promise<Record<string, unknown>> {
    const res = await this.http.get(`/files/${fileId}/images`);
    return res.data;
  }

  async getNodeImages(
    fileId: string,
    nodeIds: string[],
    format: "png" | "svg" | "jpg" | "pdf" = "png",
    scale = 2
  ): Promise<Record<string, unknown>> {
    const ids = nodeIds.map((id) => id.replace(/-/g, ":")).join(",");
    const res = await this.http.get(`/images/${fileId}`, {
      params: { ids, format, scale },
    });
    return res.data;
  }

  async getFileVariables(fileId: string): Promise<Record<string, unknown>> {
    try {
      const res = await this.http.get(`/files/${fileId}/variables/local`);
      return res.data;
    } catch {
      // Variables endpoint requires Editor access; silently return empty for Viewer tokens
      return {};
    }
  }

  async getComponent(componentKey: string): Promise<Record<string, unknown>> {
    const res = await this.http.get(`/components/${componentKey}`);
    return res.data;
  }

  async getFileComments(fileId: string): Promise<Record<string, unknown>> {
    const res = await this.http.get(`/files/${fileId}/comments`);
    return res.data;
  }
}
