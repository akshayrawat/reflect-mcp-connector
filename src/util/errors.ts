export class ReflectApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(options: { status: number; url: string; message: string }) {
    super(`Reflect API error ${options.status}: ${options.message}`);
    this.name = "ReflectApiError";
    this.status = options.status;
    this.url = options.url;
  }
}

export function toUserFacingError(err: unknown): string {
  if (err instanceof ReflectApiError) return `${err.message} (${err.url})`;
  if (err instanceof Error) return err.message;
  return String(err);
}
