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

Add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `VITE_GITHUB_CLIENT_ID` to the deployment environment. The client ID is safe to expose to the browser; the client secret must remain server-only. The application uses the OAuth authorization-code flow with a one-time state nonce, then creates a signed HttpOnly session cookie.

This is a breaking identity-provider migration from the earlier preview-only Manus OAuth implementation. Existing records keyed to old Manus `openId` values are not automatically linked to a new `github:<id>` identity. Before production use, review existing users and transfer domain ownership only through a verified administrative migration; do not guess or match accounts by display name or email alone.

## Vercel

Import the repository and keep the build command as `pnpm build`. The included `vercel.json` publishes `dist/public` and schedules `/api/scheduled/check-expiry` daily. The `api/index.ts` entry adapts the Express application to a Vercel Function; do not expose `dist/index.js` as the public root.

Configure these variables for Production:

```text
DATABASE_URL
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
VITE_GITHUB_CLIENT_ID
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
SESSION_SECRET
SCHEDULED_TASK_SECRET
VITE_REPO_URL
```

Vercel Cron can use its built-in `CRON_SECRET` authorization convention; the endpoint also accepts `X-Scheduled-Secret` with `SCHEDULED_TASK_SECRET` for other runners. Do not put secrets in `vercel.json` or the repository.

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
