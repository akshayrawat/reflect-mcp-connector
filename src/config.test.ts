import { describe, expect, it } from "vitest";

import { loadAuthConfig, loadServerConfig } from "./config.js";

describe("loadServerConfig", () => {
  it("requires REFLECT_ACCESS_TOKEN", () => {
    expect(() => loadServerConfig({})).toThrow(/REFLECT_ACCESS_TOKEN/);
  });

  it("defaults base URL", () => {
    const cfg = loadServerConfig({ REFLECT_ACCESS_TOKEN: "x" });
    expect(cfg.apiBaseUrl).toBe("https://reflect.app/api");
  });
});

describe("loadAuthConfig", () => {
  it("requires REFLECT_CLIENT_ID", () => {
    expect(() => loadAuthConfig({})).toThrow(/REFLECT_CLIENT_ID/);
  });

  it("defaults redirect URI", () => {
    const cfg = loadAuthConfig({ REFLECT_CLIENT_ID: "x" });
    expect(cfg.redirectUri).toBe("http://127.0.0.1:8787/callback");
  });
});

