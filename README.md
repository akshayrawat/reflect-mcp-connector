# Reflect MCP Connector

Connect your [Reflect](https://reflect.app) account to any MCP-compatible client (Claude Desktop, Claude Code, Codex, etc.).

This repo provides an MCP server that runs over stdio and exposes a small set of high-signal tools for Reflect (graphs/books/links + creating/appending notes).

## Requirements

- Node.js `>= 20`

## Quickstart (end users)

### 1) Get a Reflect access token

Generate an access token in Reflect’s developer settings and copy it:

- https://reflect.app/developer/oauth

You’ll set it as `REFLECT_ACCESS_TOKEN` in your MCP client config.

### 2) Add the server to your MCP client

Most MCP clients need:

- a command (recommended: `npx`)
- args (recommended: `-y reflect-mcp-connector@latest`)
- environment variables (`REFLECT_ACCESS_TOKEN`)

If you publish this under a different npm package name (e.g. a scope), replace `reflect-mcp-connector@latest` accordingly.

#### Claude Desktop

In `claude_desktop_config.json`, add:

```json
{
  "mcpServers": {
    "reflect": {
      "command": "npx",
      "args": ["-y", "reflect-mcp-connector@latest"],
      "env": {
        "REFLECT_ACCESS_TOKEN": "REDACTED"
      }
    }
  }
}
```

You can also copy `examples/claude_desktop_config.json` and edit the paths/env.

Optional: set `REFLECT_DEFAULT_GRAPH_ID` to a specific graph id so you don’t need to pass `graphId` to every tool call.

If you prefer not to use `npx`, you can install globally and set `command` to `reflect-mcp-connector`:

```bash
npm install -g reflect-mcp-connector
```

#### Claude Code

Add the server via the Claude Code CLI:

```bash
claude mcp add -e REFLECT_ACCESS_TOKEN="REDACTED" reflect -- npx -y reflect-mcp-connector@latest
```

Optional: add `-e REFLECT_DEFAULT_GRAPH_ID="..."` to set a default graph.

#### Codex

Add the server via the Codex CLI:

```bash
codex mcp add reflect --env REFLECT_ACCESS_TOKEN="REDACTED" -- npx -y reflect-mcp-connector@latest
```

Optional: add `--env REFLECT_DEFAULT_GRAPH_ID="..."` to set a default graph.

### 3) Try it

Run the tool `reflect_get_me` or `reflect_list_graphs` to confirm connectivity and grab your graph id.

## Tools

- `reflect_get_me`
- `reflect_list_graphs`
- `reflect_list_books`
- `reflect_list_links`
- `reflect_create_link`
- `reflect_append_daily_note`
- `reflect_create_note`

## Configuration

Server:

- `REFLECT_ACCESS_TOKEN` (required)
- `REFLECT_DEFAULT_GRAPH_ID` (optional; if unset the server uses the first graph id on your account)
- `REFLECT_API_BASE_URL` (optional; defaults to `https://reflect.app/api`)

OAuth helper:

- `REFLECT_CLIENT_ID` (required)
- `REFLECT_CLIENT_SECRET` (optional)
- `REFLECT_OAUTH_REDIRECT_URI` (optional; defaults to `http://127.0.0.1:8787/callback`)

## OAuth helper (optional)

If you don’t have an access token yet, run the OAuth PKCE helper:

```bash
REFLECT_CLIENT_ID="..." REFLECT_CLIENT_SECRET="..." npx -y reflect-mcp-connector@latest auth login
```

This prints an authorization URL, starts a localhost callback server, and prints a `REFLECT_ACCESS_TOKEN` you can paste into your MCP client.

## Development (from source)

If you want to run from this GitHub repo (development/contributing), you can use a `.env` file (this repo ignores `.env*`):

```bash
npm install
npm run build

cp .env.example .env
npm run dev
```

### Publishing a new version

This repo publishes to npm via GitHub Actions on version tags (`v*`). Prereq: set the `NPM_TOKEN` GitHub Actions secret with an npm token that can publish `reflect-mcp-connector`.

```bash
# bump version + create git tag (vX.Y.Z)
npm version patch   # or minor / major

# push commit + tag to trigger release workflow
git push --follow-tags
```

## Security

- Never commit tokens or OAuth secrets.
- Prefer setting env vars in your MCP client config (avoid relying on working directories / `.env` loading).
