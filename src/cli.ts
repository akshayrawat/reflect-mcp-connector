import "dotenv/config";

import { startMcpServer } from "./server.js";
import { authLogin } from "./reflect/oauth.js";

function printHelp(): void {
  process.stderr.write(
    [
      "reflect-mcp-connector",
      "",
      "Usage:",
      "  reflect-mcp-connector                 Start MCP server over stdio (default)",
      "  reflect-mcp-connector auth login      Run OAuth PKCE login helper (prints token)",
      "",
      "Environment:",
      "  REFLECT_ACCESS_TOKEN (required for server)",
      "  REFLECT_DEFAULT_GRAPH_ID (optional)",
      "  REFLECT_API_BASE_URL (optional, default https://reflect.app/api)",
      "",
      "OAuth helper:",
      "  REFLECT_CLIENT_ID (required)",
      "  REFLECT_CLIENT_SECRET (optional)",
      "  REFLECT_OAUTH_REDIRECT_URI (optional, default http://127.0.0.1:8787/callback)",
      "",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exitCode = 0;
    return;
  }

  if (args[0] === "auth" && args[1] === "login") {
    await authLogin();
    return;
  }

  if (args.length > 0 && args[0] !== "auth") {
    process.stderr.write(`Unknown command: ${args.join(" ")}\n\n`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  await startMcpServer();
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});
