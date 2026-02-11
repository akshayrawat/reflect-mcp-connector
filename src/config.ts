import { z } from "zod";

const ServerEnvSchema = z.object({
  REFLECT_ACCESS_TOKEN: z.string().min(1),
  REFLECT_DEFAULT_GRAPH_ID: z.string().min(1).optional(),
  REFLECT_API_BASE_URL: z.string().url().optional(),
});

export type ServerConfig = {
  accessToken: string;
  defaultGraphId?: string;
  apiBaseUrl: string;
};

export function loadServerConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const parsed = ServerEnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return {
    accessToken: parsed.data.REFLECT_ACCESS_TOKEN,
    defaultGraphId: parsed.data.REFLECT_DEFAULT_GRAPH_ID,
    apiBaseUrl: parsed.data.REFLECT_API_BASE_URL ?? "https://reflect.app/api",
  };
}

const AuthEnvSchema = z.object({
  REFLECT_CLIENT_ID: z.string().min(1),
  REFLECT_CLIENT_SECRET: z.string().min(1).optional(),
  REFLECT_OAUTH_REDIRECT_URI: z.string().url().optional(),
});

export type AuthConfig = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
};

export function loadAuthConfig(env: NodeJS.ProcessEnv): AuthConfig {
  const parsed = AuthEnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid OAuth environment configuration: ${issues}`);
  }

  return {
    clientId: parsed.data.REFLECT_CLIENT_ID,
    clientSecret: parsed.data.REFLECT_CLIENT_SECRET,
    redirectUri: parsed.data.REFLECT_OAUTH_REDIRECT_URI ?? "http://127.0.0.1:8787/callback",
  };
}

