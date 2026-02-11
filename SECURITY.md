# Security Policy

## Reporting a Vulnerability

Please open a GitHub Security Advisory or a private issue with details.

## Secrets

Do **not** commit:

- `REFLECT_ACCESS_TOKEN`
- `REFLECT_CLIENT_SECRET`
- any OAuth refresh/access tokens

Use environment variables or a local `.env` file (this repo ignores `.env*`).

