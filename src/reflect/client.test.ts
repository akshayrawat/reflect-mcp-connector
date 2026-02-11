import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReflectClient } from "./client.js";
import { ReflectApiError } from "../util/errors.js";

function mockFetchOk(json: unknown) {
  return vi.fn<typeof fetch>(async (_input, _init) => {
    return {
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(json),
    } as Response;
  });
}

describe("ReflectClient", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("calls the expected endpoint with bearer auth", async () => {
    const fetchMock = mockFetchOk({ success: true });
    globalThis.fetch = fetchMock;

    const client = new ReflectClient({
      accessToken: "test-token",
      baseUrl: "https://reflect.app/api",
    });

    await client.createNote("graph123", { subject: "Hi", content_markdown: "Body" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://reflect.app/api/graphs/graph123/notes");
    expect(init).toBeDefined();
    expect(init!.method).toBe("POST");
    expect((init!.headers as Record<string, string>).authorization).toBe("Bearer test-token");
  });

  it("throws ReflectApiError on non-2xx responses", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_input, _init) => {
      return {
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "text/plain" }),
        text: async () => "Unauthorized",
        statusText: "Unauthorized",
      } as Response;
    });
    globalThis.fetch = fetchMock;

    const client = new ReflectClient({
      accessToken: "test-token",
      baseUrl: "https://reflect.app/api",
    });

    await expect(client.getMe()).rejects.toBeInstanceOf(ReflectApiError);
  });
});
