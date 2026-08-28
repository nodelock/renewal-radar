# Deployment

Repository: https://github.com/nodelock/renewal-radar

## PostgreSQL

Create a PostgreSQL database with Neon or Supabase and copy its pooled connection string into the deployment platform as `DATABASE_URL`. The schema is PostgreSQL-specific and does not require a vendor-specific extension. Apply the SQL in `drizzle/migrations/0000_foamy_sir_ram.sql` with the provider SQL editor or `pnpm drizzle-kit migrate` from a trusted environment.

## GitHub OAuth

Create a GitHub OAuth App with the deployed application URL as its homepage. For the Vercel project `renewal-radar-three.vercel.app`, use:

```text
Homepage URL:
https://renewal-radar-three.vercel.app

Authorization callback URL:
https://renewal-radar-three.vercel.app/api/oauth/callback
```

For a private single-owner deployment, add `VITE_GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_ALLOWED_USERNAME`. The client ID is intentionally public because the browser uses it to start OAuth; the client secret remains server-only. `GITHUB_ALLOWED_USERNAME` is your GitHub username, for example `nodelock`. The callback rejects every account whose GitHub login does not match it, before creating a user or session. The application uses the OAuth authorization-code flow with a one-time state nonce and a signed HttpOnly session cookie.

This is a breaking identity-provider migration from the earlier preview-only Manus OAuth implementation. Existing records keyed to old Manus `openId` values are not automatically linked to a new `github:<id>` identity. Before production use, review existing users and transfer domain ownership only through a verified administrative migration; do not guess or match accounts by display name or email alone.

## Vercel

Import the repository and keep the build command as `pnpm build`. The included `vercel.json` publishes `dist/public` and schedules `/api/scheduled/check-expiry` daily. The `api/index.ts` entry adapts the Express application to a Vercel Function, while `api/[...path].ts` handles nested routes such as `/api/oauth/callback`, `/api/trpc`, and `/api/scheduled/check-expiry`; do not expose `dist/index.js` as the public root.

Configure these variables for Production:

```text
DATABASE_URL
VITE_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_ALLOWED_USERNAME
SESSION_SECRET
CRON_SECRET
```

Optional Telegram reminder variables:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Optional variables:

```text
VITE_REPO_URL
SCHEDULED_TASK_SECRET
```

For the smallest personal deployment, the core variables are `DATABASE_URL`, `VITE_GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_ALLOWED_USERNAME`, `SESSION_SECRET`, and `CRON_SECRET`. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` only when Telegram reminders are enabled. Add `SCHEDULED_TASK_SECRET` only when using an external scheduler instead of Vercel Cron. `VITE_GITHUB_CLIENT_ID` and `VITE_REPO_URL` are public configuration values; `VITE_REPO_URL` is optional because the application has a fallback. Do not add the old duplicate `GITHUB_CLIENT_ID`, and do not create `VITE_GITHUB_CLIENT_SECRET`. No `OWNER_OPEN_ID`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, or Manus-specific variables are required for this GitHub-only deployment.

To obtain `GITHUB_ALLOWED_USERNAME`, use your GitHub username. Copy only the username into Vercel. If the value is missing, login is intentionally denied.

Vercel Cron uses its built-in `CRON_SECRET` authorization convention. If you use GitHub Actions or another external runner instead, add `SCHEDULED_TASK_SECRET` and send it as `X-Scheduled-Secret`. Do not put secrets in `vercel.json` or the repository.

## Netlify

Import the repository and configure the build command and publish directory from `netlify.toml`. Add the same server-side variables. The included schedule describes the daily trigger. Netlify deployments should forward the scheduled invocation to `/api/scheduled/check-expiry` with `X-Scheduled-Secret` set from the site's environment. Do not make the scheduled endpoint public without the secret.

## GitHub Actions alternative

GitHub Actions can call the endpoint once a day from a private repository. Store `APP_URL` and `SCHEDULED_TASK_SECRET` as Actions secrets. Use a repository-level `workflow_dispatch` button for manual testing. Do not put customer domains, Telegram tokens, or database data in repository files.

## Post-deployment verification

1. Open the public homepage and complete GitHub sign-in.
2. Confirm the browser returns to `/dashboard` after the OAuth callback.
3. Add a test domain with an HTTPS renewal URL.
4. Call the scheduled endpoint from a secure runner and confirm a `job_runs` row is written.
5. Confirm the notification log prevents a second message for the same domain, type, and expiry date.
6. Remove the test asset and rotate any temporary credentials.
