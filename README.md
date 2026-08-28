# Renewal Radar

Repository: https://github.com/nodelock/renewal-radar

Renewal Radar is an open-source domain asset control room for keeping renewal dates, registrar links, notes, and Telegram reminders in one calm workspace.

> Track renewals before they become incidents.

## Status

This repository is an original implementation inspired by the general problem of fragmented domain renewal management. It does not copy the reference worker's authentication, storage, UI, or code structure. The project is released under the MIT License with author attribution in the repository history and project metadata.

The application includes a public product page, GitHub OAuth sign-in, a responsive dashboard, PostgreSQL domain storage, protected reminder scanning, and Telegram notification workflow.

## Stack

- React + TypeScript + Tailwind CSS
- Express + tRPC for typed server procedures
- PostgreSQL through Drizzle ORM, compatible with Neon and Supabase
- GitHub OAuth authorization-code login with signed HttpOnly sessions
- Telegram Bot API for reminders
- Vercel and Netlify deployment configurations

## Environment variables

For a private single-owner Vercel deployment, configure the following variables. Copy the names from `env.example`, replace every placeholder with a real value, and never commit those values to Git.

| Variable | Required | Exposure | Purpose |
|---|---:|---|---|
| `DATABASE_URL` | Yes | Server-only | PostgreSQL connection string from Neon or Supabase; use a pooled URL with `sslmode=require` when provided. |
| `VITE_GITHUB_CLIENT_ID` | Yes | Public | GitHub OAuth App client ID used by the browser and server. It is intentionally public; do not mark it as a secret. |
| `GITHUB_CLIENT_SECRET` | Yes | Server-only | GitHub OAuth App client secret. Never use a `VITE_` prefix for this value. |
| `GITHUB_ALLOWED_USER_ID` | Yes | Server-only | Your immutable numeric GitHub user ID. Every other GitHub account is rejected. |
| `TELEGRAM_BOT_TOKEN` | For Telegram alerts | Server-only | Bot token created by BotFather. |
| `TELEGRAM_CHAT_ID` | For Telegram alerts | Server-only | Telegram chat that receives renewal reminders. |
| `SESSION_SECRET` | Yes | Server-only | Long random value used to sign HttpOnly login sessions. |
| `SCHEDULED_TASK_SECRET` | Yes | Server-only | Long random value used to protect the expiry-scan endpoint. |
| `CRON_SECRET` | For Vercel Cron | Server-only | Use the same value as `SCHEDULED_TASK_SECRET` so Vercel Cron authorization matches the endpoint. |
| `VITE_REPO_URL` | Recommended | Public | Repository link shown by the homepage, normally `https://github.com/nodelock/renewal-radar`. |

`VITE_GITHUB_CLIENT_ID` and `VITE_REPO_URL` are the only public values in this list. The duplicated `GITHUB_CLIENT_ID` variable is not required by the current configuration; use the single `VITE_GITHUB_CLIENT_ID` value instead.

To enable private single-owner login, set `GITHUB_ALLOWED_USER_ID` to your GitHub numeric user ID, not your username, display name, or email. You can find the number from the `id` field returned by GitHub's authenticated user API or from your GitHub account tooling. If this variable is missing or does not match the authenticated profile, the OAuth callback returns an authorization error and does not create a user or session.

For local or Preview environments, use a separate GitHub OAuth App when possible. The production callback URL for the current project is:

```text
https://renewal-radar-three.vercel.app/api/oauth/callback
```

Real secrets should be added separately to the Production, Preview, and Development environments only when those environments are actively used.

## Local development

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

For local GitHub OAuth, create a separate OAuth App and use this callback URL:

```text
http://localhost:3000/api/oauth/callback
```

## Deployment

Import the GitHub repository into Vercel or Netlify, set the required environment variables, provision a PostgreSQL database, apply the migration in `drizzle/migrations`, and configure the platform's daily scheduled callback to the documented server endpoint. The Vercel adapter is `api/index.ts`; the public frontend is built to `dist/public`.

For the current Vercel project, configure the GitHub OAuth App with:

```text
Homepage URL:
https://renewal-radar-three.vercel.app

Authorization callback URL:
https://renewal-radar-three.vercel.app/api/oauth/callback
```

The scheduled handler must be authenticated, idempotent, and independent of any browser session.

## Security

See `SECURITY.md` for reporting guidance. Production credentials belong only in deployment secrets. Renewal URLs are restricted to HTTPS and all state-changing procedures must validate authenticated ownership and request origin.

## Contributing

See `CONTRIBUTING.md` and `AI_MAINTENANCE.md` before opening a pull request. Changes should include tests, preserve the PostgreSQL schema contract, and avoid introducing hardcoded customer data, credentials, or fake testimonials.
