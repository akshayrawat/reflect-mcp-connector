import type {
  ReflectBook,
  ReflectGraph,
  ReflectLink,
  ReflectSuccess,
  ReflectUser,
} from "./types.js";
import { ReflectApiError } from "../util/errors.js";

type HttpMethod = "GET" | "POST" | "PUT";

type ReflectClientOptions = {
  accessToken: string;
  baseUrl: string;
  userAgent?: string;
};

export class ReflectClient {
  readonly #accessToken: string;
  readonly #baseUrl: string;
  readonly #userAgent: string;

  constructor(options: ReflectClientOptions) {
    this.#accessToken = options.accessToken;
    this.#baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.#userAgent = options.userAgent ?? "reflect-mcp-connector";
  }

  async getMe(): Promise<ReflectUser> {
    return this.#requestJson<ReflectUser>("GET", "/users/me");
  }

  async listGraphs(): Promise<ReflectGraph[]> {
    return this.#requestJson<ReflectGraph[]>("GET", "/graphs");
  }

  async listBooks(graphId: string): Promise<ReflectBook[]> {
    return this.#requestJson<ReflectBook[]>("GET", `/graphs/${encodeURIComponent(graphId)}/books`);
  }

  async listLinks(graphId: string): Promise<ReflectLink[]> {
    return this.#requestJson<ReflectLink[]>("GET", `/graphs/${encodeURIComponent(graphId)}/links`);
  }

  async createLink(
    graphId: string,
    link: Partial<ReflectLink> & { url: string },
  ): Promise<ReflectLink> {
    return this.#requestJson<ReflectLink>(
      "POST",
      `/graphs/${encodeURIComponent(graphId)}/links`,
      link,
    );
  }

  async appendDailyNote(
    graphId: string,
    body: { text: string; date?: string; list_name?: string },
  ): Promise<ReflectSuccess> {
    return this.#requestJson<ReflectSuccess>(
      "PUT",
      `/graphs/${encodeURIComponent(graphId)}/daily-notes`,
      {
        ...body,
        transform_type: "list-append",
      },
    );
  }

  async createNote(
    graphId: string,
    body: { subject: string; content_markdown: string; pinned?: boolean },
  ): Promise<ReflectSuccess> {
    return this.#requestJson<ReflectSuccess>(
      "POST",
      `/graphs/${encodeURIComponent(graphId)}/notes`,
      body,
    );
  }

  async resolveDefaultGraphId(explicitGraphId?: string): Promise<string> {
    if (explicitGraphId) return explicitGraphId;
    const me = await this.getMe();
    const graphId = me.graph_ids?.[0];
    if (!graphId) throw new Error("No graph ids found for current user.");
    return graphId;
  }

  async #requestJson<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const url = new URL(this.#baseUrl + path);

    const res = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${this.#accessToken}`,
        "content-type": "application/json",
        "user-agent": this.#userAgent,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") ?? "";
    const raw = await res.text();

    if (!res.ok) {
      throw new ReflectApiError({
        status: res.status,
        message: raw || res.statusText,
        url: url.toString(),
      });
    }

    if (!raw) return undefined as T;
    if (contentType.includes("application/json")) return JSON.parse(raw) as T;

    throw new ReflectApiError({
      status: res.status,
      message: `Unexpected content-type: ${contentType}`,
      url: url.toString(),
    });
  }
}
