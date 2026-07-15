import { describe, it, expect, beforeEach } from "vitest";
import {
  createDispatcher,
  registerHandler,
  SuccessResponse,
  ErrorResponse,
  getRegistrySize,
} from "../src/dispatcher";
// Import handlers to register all handlers before the tests run
import "../src/handlers";

// Capture the registry size after all application handlers are loaded, before test handlers are added
const EXPECTED_REGISTRY_SIZE = getRegistrySize();

// Helper to check if response is a success response
function isSuccess(response: any): response is SuccessResponse {
  return "data" in response;
}

// Helper to check if response is an error response
function isError(response: any): response is ErrorResponse {
  return "error" in response;
}

describe("Dispatcher", () => {
  beforeEach(() => {
    // Clear registry before each test by creating a fresh dispatcher
  });

  it("should register a handler by type string", async () => {
    const dispatcher = createDispatcher();
    const handler = async (params: any) => ({ result: "ok" });

    registerHandler("test_command", handler);

    // Verify by dispatching a request for that type
    const response = await dispatcher.dispatch({
      type: "test_command",
      requestId: "req-1",
    });

    expect(response.type).toBe("test_command");
    expect(response.requestId).toBe("req-1");
    expect(isSuccess(response)).toBe(true);
    if (isSuccess(response)) {
      expect(response.data).toEqual({ result: "ok" });
    }
  });

  it("should echo type and requestId in success response", async () => {
    const dispatcher = createDispatcher();
    registerHandler("echo_test", async (params: any) => ({
      echoed: params.value,
    }));

    const response = await dispatcher.dispatch({
      type: "echo_test",
      requestId: "unique-id-123",
      value: "hello",
    });

    expect(response.type).toBe("echo_test");
    expect(response.requestId).toBe("unique-id-123");
    expect(isSuccess(response)).toBe(true);
    if (isSuccess(response)) {
      expect(response.data).toEqual({ echoed: "hello" });
    }
  });

  it("should wrap success response as {type, requestId, data}", async () => {
    const dispatcher = createDispatcher();
    registerHandler("test_wrap", async () => ({
      status: "success",
    }));

    const response = await dispatcher.dispatch({
      type: "test_wrap",
      requestId: "req-wrap",
    });

    expect(response).toHaveProperty("type");
    expect(response).toHaveProperty("requestId");
    expect(response).toHaveProperty("data");
    expect(Object.keys(response).sort()).toEqual(
      ["data", "requestId", "type"].sort(),
    );
  });

  it("should return error response when handler throws", async () => {
    const dispatcher = createDispatcher();
    const errorMsg = "Handler failed";
    registerHandler("throw_test", async () => {
      throw new Error(errorMsg);
    });

    const response = await dispatcher.dispatch({
      type: "throw_test",
      requestId: "req-throw",
    });

    expect(response.type).toBe("throw_test");
    expect(response.requestId).toBe("req-throw");
    expect(isError(response)).toBe(true);
    if (isError(response)) {
      expect(response.error.message).toBe(errorMsg);
    }
  });

  it("should return error response when handler rejects", async () => {
    const dispatcher = createDispatcher();
    const errorMsg = "Handler rejected";
    registerHandler("reject_test", async () => {
      return Promise.reject(new Error(errorMsg));
    });

    const response = await dispatcher.dispatch({
      type: "reject_test",
      requestId: "req-reject",
    });

    expect(response.type).toBe("reject_test");
    expect(response.requestId).toBe("req-reject");
    expect(isError(response)).toBe(true);
    if (isError(response)) {
      expect(response.error.message).toBe(errorMsg);
    }
  });

  it("should return Unknown request type error for unregistered type", async () => {
    const dispatcher = createDispatcher();

    const response = await dispatcher.dispatch({
      type: "unknown_command",
      requestId: "req-unknown",
    });

    expect(response.type).toBe("unknown_command");
    expect(response.requestId).toBe("req-unknown");
    expect(isError(response)).toBe(true);
    if (isError(response)) {
      expect(response.error.message).toBe(
        "Unknown request type: unknown_command",
      );
    }
  });

  it("should preserve error message format for handler errors", async () => {
    const dispatcher = createDispatcher();
    registerHandler("format_test", async () => {
      throw new Error("Custom error message");
    });

    const response = await dispatcher.dispatch({
      type: "format_test",
      requestId: "req-fmt",
    });

    expect(isError(response)).toBe(true);
    if (isError(response)) {
      expect(response.error.message).toBe("Custom error message");
    }
  });

  it("should handle multiple registered handlers independently", async () => {
    const dispatcher = createDispatcher();
    registerHandler("cmd_a", async (params: any) => ({ source: "a" }));
    registerHandler("cmd_b", async (params: any) => ({ source: "b" }));

    const respA = await dispatcher.dispatch({
      type: "cmd_a",
      requestId: "req-a",
    });
    const respB = await dispatcher.dispatch({
      type: "cmd_b",
      requestId: "req-b",
    });

    expect(isSuccess(respA)).toBe(true);
    expect(isSuccess(respB)).toBe(true);
    if (isSuccess(respA)) {
      expect(respA.data.source).toBe("a");
    }
    if (isSuccess(respB)) {
      expect(respB.data.source).toBe("b");
    }
  });

  it("should pass request params to handler", async () => {
    const dispatcher = createDispatcher();
    registerHandler("param_test", async (params: any) => ({
      received: params,
    }));

    const response = await dispatcher.dispatch({
      type: "param_test",
      requestId: "req-params",
      foo: "bar",
      baz: 123,
    });

    expect(isSuccess(response)).toBe(true);
    if (isSuccess(response)) {
      expect(response.data.received).toEqual({
        type: "param_test",
        requestId: "req-params",
        foo: "bar",
        baz: 123,
      });
    }
  });

  it("should have 72 handlers registered (Tasks 4-11)", () => {
    expect(EXPECTED_REGISTRY_SIZE).toBe(72);
  });
});
