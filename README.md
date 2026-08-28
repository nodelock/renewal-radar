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
| `GITHUB_ALLOWED_USERNAME` | Yes | Server-only | Your GitHub username. Every other GitHub account is rejected. |
| `TELEGRAM_BOT_TOKEN` | For Telegram alerts | Server-only | Bot token created by BotFather. |
| `TELEGRAM_CHAT_ID` | For Telegram alerts | Server-only | Telegram chat that receives renewal reminders. |
| `SESSION_SECRET` | Yes | Server-only | Long random value used to sign HttpOnly login sessions. |
| `CRON_SECRET` | Yes for Vercel Cron | Server-only | Long random value used to protect the scheduled expiry scan. |
| `SCHEDULED_TASK_SECRET` | External scheduler only | Server-only | Optional compatibility secret for GitHub Actions or another scheduler. |
| `VITE_REPO_URL` | Recommended | Public | Repository link shown by the homepage, normally `https://github.com/nodelock/renewal-radar`. |

`VITE_GITHUB_CLIENT_ID` and `VITE_REPO_URL` are public values. The duplicated `GITHUB_CLIENT_ID` variable is not required by the current configuration; use the single `VITE_GITHUB_CLIENT_ID` value instead. `VITE_REPO_URL` is optional because the application has a repository URL fallback.

To enable private single-owner login, set `GITHUB_ALLOWED_USERNAME` to your GitHub username, for example `nodelock`. The comparison is case-insensitive and ignores surrounding whitespace. If this variable is missing or does not match the authenticated GitHub profile, the OAuth callback returns an authorization error and does not create a user or session. If you later rename your GitHub account, update this Vercel variable.

For local or Preview environments, use a separate GitHub OAuth App when possible. The production callback URL for the current project is:

```text
https://renewal-radar-three.vercel.app/api/oauth/callback
```

For the smallest personal deployment, the core variables are `DATABASE_URL`, `VITE_GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_ALLOWED_USERNAME`, `SESSION_SECRET`, and `CRON_SECRET`. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` only when Telegram reminders are enabled. Add `SCHEDULED_TASK_SECRET` only when using an external scheduler instead of Vercel Cron. Real secrets should be added separately to the Production, Preview, and Development environments only when those environments are actively used.

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
