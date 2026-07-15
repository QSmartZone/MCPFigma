/**
 * Dispatcher core — pure TypeScript, no Figma global imports.
 * Handles request/response protocol envelope and registry-based handler dispatch.
 */

export interface SuccessResponse {
  type: string;
  requestId: string;
  data: any;
}

export interface ErrorResponse {
  type: string;
  requestId: string;
  error: string;
}

export type DispatchResponse = SuccessResponse | ErrorResponse;

export interface DispatchRequest {
  type: string;
  requestId: string;
  [key: string]: any;
}

export type Handler = (params: any) => Promise<any>;

/**
 * Global registry for handlers.
 * Maps command type string → handler function.
 */
const globalRegistry = new Map<string, Handler>();

/**
 * Register a handler for a given command type.
 * @param type Command type string
 * @param handler Async function that receives params and returns data
 */
export function registerHandler(type: string, handler: Handler): void {
  globalRegistry.set(type, handler);
}

/**
 * Get the current registry size (for testing/verification).
 */
export function getRegistrySize(): number {
  return globalRegistry.size;
}

/**
 * Dispatcher class handles incoming requests.
 */
export class Dispatcher {
  /**
   * Dispatch a request using the global registry.
   * @param request Request with type, requestId, and flat params
   * @returns Promise<DispatchResponse> — success {type, requestId, data} or error {type, requestId, error}
   */
  async dispatch(request: DispatchRequest): Promise<DispatchResponse> {
    const { type, requestId } = request;

    // Look up handler
    const handler = globalRegistry.get(type);

    if (!handler) {
      return {
        type,
        requestId,
        error: `Unknown request type: ${type}`,
      };
    }

    try {
      // Call handler with full request (includes type, requestId, and all params)
      const data = await handler(request);

      return {
        type,
        requestId,
        data,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err || "Unknown error");

      return {
        type,
        requestId,
        error: message,
      };
    }
  }
}

/**
 * Create and return a fresh Dispatcher instance.
 */
export function createDispatcher(): Dispatcher {
  return new Dispatcher();
}
