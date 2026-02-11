import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { loadServerConfig } from "./config.js";
import { ReflectClient } from "./reflect/client.js";
import { toUserFacingError } from "./util/errors.js";

function jsonText(value: unknown): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function safeTool<TArgs extends Record<string, unknown>>(
  fn: (args: TArgs) => Promise<{ content: Array<{ type: "text"; text: string }> }>,
): (args: TArgs) => Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  return async (args: TArgs) => {
    try {
      return await fn(args);
    } catch (err) {
      return { content: [{ type: "text", text: toUserFacingError(err) }], isError: true };
    }
  };
}

export async function startMcpServer(): Promise<void> {
  const config = loadServerConfig(process.env);
  const reflect = new ReflectClient({
    accessToken: config.accessToken,
    baseUrl: config.apiBaseUrl,
  });

  const server = new McpServer({
    name: "reflect-mcp-connector",
    version: "0.1.0",
  });

  server.tool(
    "reflect_get_me",
    {},
    safeTool(async () => {
      const me = await reflect.getMe();
      return jsonText(me);
    }),
  );

  server.tool(
    "reflect_list_graphs",
    {},
    safeTool(async () => {
      const graphs = await reflect.listGraphs();
      return jsonText(graphs);
    }),
  );

  server.tool(
    "reflect_list_books",
    {
      graphId: z.string().min(1).optional().describe("Reflect graph id (optional)."),
    },
    safeTool(async ({ graphId }) => {
      const resolved = await reflect.resolveDefaultGraphId(graphId ?? config.defaultGraphId);
      const books = await reflect.listBooks(resolved);
      return jsonText(books);
    }),
  );

  server.tool(
    "reflect_list_links",
    {
      graphId: z.string().min(1).optional().describe("Reflect graph id (optional)."),
    },
    safeTool(async ({ graphId }) => {
      const resolved = await reflect.resolveDefaultGraphId(graphId ?? config.defaultGraphId);
      const links = await reflect.listLinks(resolved);
      return jsonText(links);
    }),
  );

  server.tool(
    "reflect_create_link",
    {
      graphId: z.string().min(1).optional().describe("Reflect graph id (optional)."),
      url: z.string().url().describe("URL to save to Reflect."),
      title: z.string().min(1).optional().describe("Optional title override."),
      description: z.string().min(1).optional().describe("Optional description."),
      highlights: z.array(z.string().min(1)).optional().describe("Optional list of highlights."),
    },
    safeTool(async ({ graphId, url, title, description, highlights }) => {
      const resolved = await reflect.resolveDefaultGraphId(graphId ?? config.defaultGraphId);
      const created = await reflect.createLink(resolved, { url, title, description, highlights });
      return jsonText(created);
    }),
  );

  server.tool(
    "reflect_append_daily_note",
    {
      graphId: z.string().min(1).optional().describe("Reflect graph id (optional)."),
      text: z.string().min(1).describe("Text to append."),
      date: z.string().min(1).optional().describe("ISO 8601 date (YYYY-MM-DD). Defaults to today."),
      listName: z
        .string()
        .min(1)
        .optional()
        .describe('List name. For backlinks use the format "[[List Name]]".'),
    },
    safeTool(async ({ graphId, text, date, listName }) => {
      const resolved = await reflect.resolveDefaultGraphId(graphId ?? config.defaultGraphId);
      const result = await reflect.appendDailyNote(resolved, {
        text,
        date,
        list_name: listName,
      });
      return jsonText(result);
    }),
  );

  server.tool(
    "reflect_create_note",
    {
      graphId: z.string().min(1).optional().describe("Reflect graph id (optional)."),
      subject: z.string().min(1).describe("Note subject/title."),
      contentMarkdown: z.string().min(1).describe("Note content in Markdown."),
      pinned: z.boolean().optional().describe("Whether the note should be pinned."),
    },
    safeTool(async ({ graphId, subject, contentMarkdown, pinned }) => {
      const resolved = await reflect.resolveDefaultGraphId(graphId ?? config.defaultGraphId);
      const result = await reflect.createNote(resolved, {
        subject,
        content_markdown: contentMarkdown,
        pinned,
      });
      return jsonText(result);
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
