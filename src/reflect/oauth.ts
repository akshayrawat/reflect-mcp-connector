import { createHash, randomBytes } from "node:crypto";
import http from "node:http";
import { URL } from "node:url";

import { loadAuthConfig } from "../config.js";

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function sha256Base64Url(input: string): string {
  const digest = createHash("sha256").update(input).digest();
  return base64UrlEncode(digest);
}

function randomUrlSafeString(bytes = 32): string {
  return base64UrlEncode(randomBytes(bytes));
}

type OAuthTokenResponse = {
  access_token: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  refresh_token?: string;
};

export async function authLogin(): Promise<void> {
  const { clientId, clientSecret, redirectUri } = loadAuthConfig(process.env);

  const redirect = new URL(redirectUri);
  if (redirect.protocol !== "http:") {
    throw new Error("REFLECT_OAUTH_REDIRECT_URI must be an http:// localhost URL.");
  }
  if (!redirect.port) {
    throw new Error("REFLECT_OAUTH_REDIRECT_URI must include an explicit port (e.g. 8787).");
  }

  const state = randomUrlSafeString(16);
  const codeVerifier = randomUrlSafeString(48);
  const codeChallenge = sha256Base64Url(codeVerifier);

  const authUrl = new URL("https://reflect.app/oauth");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "read:graph write:graph");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  process.stderr.write("Open this URL to authorize Reflect:\n\n");
  process.stderr.write(`${authUrl.toString()}\n\n`);

  const code = await waitForOAuthCode({ redirect, expectedState: state });

  const token = await exchangeCodeForToken({
    code,
    codeVerifier,
    clientId,
    clientSecret,
    redirectUri,
  });

  process.stderr.write("\nOAuth complete.\n\n");
  process.stderr.write("Set this environment variable in your MCP client:\n\n");
  process.stderr.write(`REFLECT_ACCESS_TOKEN="${token.access_token}"\n\n`);
}

async function waitForOAuthCode(options: {
  redirect: URL;
  expectedState: string;
}): Promise<string> {
  const { redirect, expectedState } = options;

  if (redirect.hostname !== "127.0.0.1" && redirect.hostname !== "localhost") {
    throw new Error(
      `OAuth redirect host must be localhost/127.0.0.1 for the helper to work (got ${redirect.hostname}).`,
    );
  }

  const port = redirect.port ? Number(redirect.port) : redirect.protocol === "https:" ? 443 : 80;
  const pathname = redirect.pathname || "/";

  return await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const reqUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);

        if (reqUrl.pathname !== pathname) {
          res.statusCode = 404;
          res.end("Not Found");
          return;
        }

        const code = reqUrl.searchParams.get("code");
        const state = reqUrl.searchParams.get("state");

        if (!code || !state) {
          res.statusCode = 400;
          res.end("Missing code/state");
          return;
        }

        if (state !== expectedState) {
          res.statusCode = 400;
          res.end("Invalid state");
          return;
        }

        res.statusCode = 200;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end("You can close this tab and return to the terminal.");

        server.close(() => resolve(code));
      } catch (e) {
        server.close(() => reject(e));
      }
    });

    server.on("error", (err) => reject(err));

    server.listen(port, redirect.hostname, () => {
      process.stderr.write(`Listening for OAuth callback on ${redirect.toString()}\n`);
    });
  });
}

async function exchangeCodeForToken(options: {
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}): Promise<OAuthTokenResponse> {
  const form = new URLSearchParams();
  form.set("grant_type", "authorization_code");
  form.set("client_id", options.clientId);
  if (options.clientSecret) form.set("client_secret", options.clientSecret);
  form.set("code", options.code);
  form.set("redirect_uri", options.redirectUri);
  form.set("code_verifier", options.codeVerifier);

  const res = await fetch("https://reflect.app/api/oauth/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${raw || res.statusText}`);
  }

  const token = JSON.parse(raw) as OAuthTokenResponse;
  if (!token.access_token) throw new Error("Token response missing access_token.");
  return token;
}
