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
| `CRON_SECRET` | Not needed for Vercel Cron | Server-only | Not required. Vercel Cron authenticates the scheduled scan via the built-in `x-vercel-cron-schedule` header, so no secret is needed. |
| `SCHEDULED_TASK_SECRET` | External scheduler only | Server-only | Optional. Only needed when the scheduled scan is triggered by an external scheduler (for example GitHub Actions or a Netlify scheduled call) via the `x-scheduled-secret` header instead of Vercel Cron. |
| `VITE_REPO_URL` | Recommended | Public | Repository link shown by the homepage, normally `https://github.com/nodelock/renewal-radar`. |

`VITE_GITHUB_CLIENT_ID` and `VITE_REPO_URL` are public values. The duplicated `GITHUB_CLIENT_ID` variable is not required by the current configuration; use the single `VITE_GITHUB_CLIENT_ID` value instead. `VITE_REPO_URL` is optional because the application has a repository URL fallback.

To enable private single-owner login, set `GITHUB_ALLOWED_USERNAME` to your GitHub username, for example `nodelock`. The comparison is case-insensitive and ignores surrounding whitespace. If this variable is missing or does not match the authenticated GitHub profile, the OAuth callback returns an authorization error and does not create a user or session. If you later rename your GitHub account, update this Vercel variable.

For local or Preview environments, use a separate GitHub OAuth App when possible. The production callback URL for the current project is:

```text
https://renewal-radar-three.vercel.app/api/oauth/callback
```

For the smallest personal deployment, the core variables are `DATABASE_URL`, `VITE_GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_ALLOWED_USERNAME`, and `SESSION_SECRET`. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` only when Telegram reminders are enabled. When using Vercel Cron, no schedule secret is required. Add `SCHEDULED_TASK_SECRET` only when the scheduled scan is triggered by an external scheduler instead of Vercel Cron. Real secrets should be added separately to the Production, Preview, and Development environments only when those environments are actively used.

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

## Database initialization with Neon

Creating a Neon project and setting `DATABASE_URL` is not enough by itself. Before the first successful sign-in, the empty Neon database must contain the Renewal Radar schema.

1. Create a Neon project and copy its pooled connection string. Keep SSL enabled; Neon connection strings normally include `sslmode=require`.
2. Open `drizzle/migrations/0000_foamy_sir_ram.sql` in this repository and copy the complete SQL file.
3. Open the Neon SQL Editor, select the intended database, paste the migration SQL, and run it once. It creates the `users`, `domains`, `notification_logs`, and `job_runs` tables, their enum types, foreign keys, indexes, and notification deduplication constraint.
4. Add the same connection string to the deployment platform as the server-only `DATABASE_URL` variable. Never commit it or expose it through a `VITE_` variable.
5. Verify the migration in Neon with:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('users', 'domains', 'notification_logs', 'job_runs')
order by table_name;
```

The query should return all four tables. The first successful GitHub callback writes the authenticated account to `users`, and adding a domain exercises the `domains` table. A database configuration or relation error during login usually means the connection string points to another database or the migration has not been applied.

If `DATABASE_URL` is already exported in a trusted environment, the equivalent CLI command is `pnpm drizzle-kit migrate`. Do not run both methods against a partially applied migration without checking the migration history first.

## Deployment

Import the GitHub repository into Vercel or Netlify, set the required environment variables, initialize PostgreSQL using the Neon procedure above, and configure the platform's daily scheduled callback. The public frontend is built to `dist/public`.

On Vercel the API is served by a single serverless function: `vercel.json` rewrites every `/api/*` path to `api/server.ts` (the concrete filename, rather than a bracket catch-all, is required for reliable deployment in this Vite build). The included `vercel.json` also schedules the daily expiry scan with a Vercel Cron job:

```text
schedule: "0 1 * * *"   →  every day at 01:00 UTC
path:     /api/scheduled/check-expiry
```

Vercel Cron calls the endpoint every day at 01:00 UTC and authenticates it automatically via the built-in `x-vercel-cron-schedule` header, so no `CRON_SECRET` is required. On Netlify or an external runner, forward the scheduled call to `/api/scheduled/check-expiry` with `x-scheduled-secret`; that scenario is documented in `DEPLOYMENT.md`.

For the current Vercel project, configure the GitHub OAuth App with:

```text
Homepage URL:
https://renewal-radar-three.vercel.app

Authorization callback URL:
https://renewal-radar-three.vercel.app/api/oauth/callback
```

The scheduled handler must be authenticated, idempotent, and independent of any browser session.

### How expiry reminders work

The daily scan reads the `expiryDate` you enter manually on each domain record (it does not query live WHOIS data). For every domain it computes the days left until that date and sends a Telegram reminder when the remaining days are within the domain's `notifyDays` threshold:

- `daysLeft < 0` → "domain has expired"
- `0 ≤ daysLeft ≤ notifyDays` → "renewal reminder"
- Reminders are de-duplicated per domain + type + trigger date, so the same reminder is not sent twice.
- If a domain has no renewal URL set, the reminder shows "renewal: not set".

Use each record's `notifyDays` to control how many days before expiry the reminder fires, or set it to 0 to be notified only after expiry.

## Security

See `SECURITY.md` for reporting guidance. Production credentials belong only in deployment secrets. Renewal URLs are restricted to HTTPS and all state-changing procedures must validate authenticated ownership and request origin.

## Contributing

See `CONTRIBUTING.md` and `AI_MAINTENANCE.md` before opening a pull request. Changes should include tests, preserve the PostgreSQL schema contract, and avoid introducing hardcoded customer data, credentials, or fake testimonials.
